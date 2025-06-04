import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import queueRequest from '../../libs/queue-request';
import { PrivateKey } from '@injectivelabs/sdk-ts';
import { CONTRACT_ADDRESS_ELEM, POCKET_ADDRESS, getCW20Balance } from '../../apis/blockchain/config';
import { BigNumberInWei } from '@injectivelabs/utils';
import { transferCW20, transferNative } from '../../libs/blockchain';
import CryptoJS from 'crypto-js';
import { CONFIG_BOOSTS, CONFIG_CHESTS, CONFIG_MANA_CLASSES } from '../../libs/game.config';
import type { MANA_CLASSES, CHESTS } from '../../libs/game.config';

const [StartRequest, EndRequest] = queueRequest();

function getRandomClass(classes: MANA_CLASSES[]): MANA_CLASSES {
    const randomIndex = Math.floor(Math.random() * classes.length);
    return classes[randomIndex];
};

export default function (router: Router) {
    router.post("/markets/buy_chest", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { chest } = req.body as CHESTS;

            if (typeof chest !== 'string' || !CONFIG_CHESTS[chest]) {
                res.status(404).json({ status: 'BAD_REQUEST' });
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const client = dbInstance.getClient();
            const session = client.startSession();
            const userCollection = db.collection('users');
            const ninjaCollection = db.collection('ninjas');
            const userMarketCollection = db.collection('user_markets');
            const offChainLogCollection = db.collection('offchain_logs');

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1, referral_code: 1, privateKey: 1 } });

            if (!dbUser || !dbUser.privateKey) {
                res.status(403).end();
                return;
            };

            const privateKey = CryptoJS.AES.decrypt(
                dbUser.privateKey,
                process.env.SECRET_KEY as string
            ).toString(CryptoJS.enc.Utf8);

            const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

            const elem_balance = new BigNumberInWei((await getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)).balance).toBase().toNumber();

            const userELEM = dbUser.wallet?.ELEM || 0;
            const { price, level, classes } = CONFIG_CHESTS[chest];

            if ((userELEM + elem_balance) >= price) {
                const chest_class = getRandomClass(classes);

                const mana = new Date();

                mana.setHours(mana.getHours() + (8 * CONFIG_MANA_CLASSES[chest_class]));

                const chestData = { ownerId: req.payload.tw_id, class: chest_class, level, mana, created_at: new Date() };

                if (userELEM >= price) {
                    try {
                        const txResponse = await transferNative(privateKey, POCKET_ADDRESS, 0.000000000000000001);

                        if (!txResponse || txResponse.code !== 0) {
                            await userMarketCollection.insertOne({ tw_id: req.payload.tw_id, type: 'buy_chest', data: { price, level, classes }, price_onchain: 0, message: 'offchain', failed_at: new Date(), created_at: new Date(), status: 'failed' });
                            res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                            return;
                        };

                        let result;

                        if (price > 0) {
                            result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after' });
                        } else {
                            result = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1 } });
                        };

                        if (result === null) {
                            if (price !== 0) {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                return;
                            };
                            res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                            return;
                        };

                        const ninjaInsert = await ninjaCollection.insertOne(chestData);

                        if (ninjaInsert.acknowledged === true) {
                            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $push: { ninjas: { id: ninjaInsert.insertedId.toHexString(), created_at: chestData.created_at } } });

                            await offChainLogCollection.insertOne({ action: 'buy_chest', tw_id: req.payload.tw_id, price, ...chestData, chestId: ninjaInsert.insertedId.toHexString() });

                            const callBackResult = { wallet: { ...result.wallet, ELEM: (result.wallet?.ELEM || 0) + elem_balance }, class: chestData.class, level: chestData.level, mana: chestData.mana };

                            res.status(200).json(callBackResult);
                            return;
                        };

                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    } catch (error: any) {
                        console.error(error);
                        if (error.contextCode === 5 || !error.contextCode) {
                            if (error.type === 'chain-error' || error.contextModule === 'wasm' || error.errorClass === 'TransactionException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                                return;
                            } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                                return;
                            } else if (error.type === 'grpc-unary-request' && error.contextModule === 'chain-auth') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                                return;
                            };
                        };
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    };
                } else {
                    const price_onchain = price - userELEM;

                    const insert = await userMarketCollection.insertOne({ tw_id: req.payload.tw_id, type: 'buy_chest', data: { price, level, classes }, price_onchain, created_at: new Date(), status: 'pending' });

                    try {
                        session.startTransaction();
                        let result;

                        result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: userELEM } }, { $inc: { 'wallet.ELEM': -userELEM } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after', session });

                        if (result === null) {
                            if (userELEM !== 0 && price !== 0) {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                return;
                            };
                            result = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1 }, session });
                        };

                        const ninjaInsert = await ninjaCollection.insertOne(chestData, { session });

                        if (ninjaInsert.acknowledged === true) {
                            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $push: { ninjas: { id: ninjaInsert.insertedId.toHexString(), created_at: chestData.created_at } } }, { session });

                            await offChainLogCollection.insertOne({ action: 'buy_chest', tw_id: req.payload.tw_id, message: 'onchain & offchain', price: userELEM, ...chestData, chestId: ninjaInsert.insertedId.toHexString() }, { session });

                            if (dbUser.referral_code?.startsWith('xninja_')) {
                                const bulkOps: any[] = [
                                    {
                                        updateOne: {
                                            filter: {
                                                invite_code: dbUser.referral_code,
                                                user_refs: { $elemMatch: { tw_id: req.payload.tw_id, rewards: { $exists: false } } }
                                            },
                                            update: { $set: { 'user_refs.$.rewards': {} } }
                                        }
                                    },
                                    {
                                        updateOne: {
                                            filter: {
                                                invite_code: dbUser.referral_code,
                                                'user_refs.tw_id': req.payload.tw_id,
                                            },
                                            update: {
                                                $inc: { 'rewards.ELEM': price_onchain * 2 / 100, 'user_refs.$[elem].rewards.ELEM': price_onchain * 2 / 100 }
                                            },
                                            arrayFilters: [{ 'elem.tw_id': req.payload.tw_id }]
                                        }
                                    },
                                ];

                                if (level >= 5) {
                                    const nextDay = new Date();

                                    nextDay.setDate(nextDay.getDate() + 21);

                                    bulkOps.push({
                                        updateOne: {
                                            filter: {
                                                invite_code: dbUser.referral_code,
                                                user_boosts: { $nin: [req.payload.tw_id] },
                                            },
                                            update: {
                                                $inc: { 'boosts.count': 1 },
                                            },
                                        },
                                    });

                                    bulkOps.push({
                                        updateOne: {
                                            filter: {
                                                invite_code: dbUser.referral_code,
                                                user_boosts: { $nin: [req.payload.tw_id] },
                                                $expr: { $in: ["$boosts.count", Object.keys(CONFIG_BOOSTS).map(i => Number(i))] },
                                            },
                                            update: {
                                                $set: { 'boosts.date': nextDay },
                                            },
                                        },
                                    });

                                    bulkOps.push({
                                        updateOne: {
                                            filter: {
                                                invite_code: dbUser.referral_code,
                                                user_boosts: { $nin: [req.payload.tw_id] },
                                            },
                                            update: {
                                                $push: { user_boosts: req.payload.tw_id },
                                            },
                                        },
                                    });
                                };

                                await userCollection.bulkWrite(bulkOps, { session });
                            };

                            const txResponse = await transferCW20(privateKey, CONTRACT_ADDRESS_ELEM, POCKET_ADDRESS, price_onchain);

                            if (txResponse && txResponse.code === 0) {
                                await session.commitTransaction();
                            } else {
                                await session.abortTransaction();
                                await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, failed_at: new Date(), status: 'failed' } });
                            };

                            const callBackResult = { wallet: { ...result?.wallet, ELEM: (result?.wallet?.ELEM || 0) + (elem_balance - price_onchain) }, class: chestData.class, level: chestData.level, mana: chestData.mana };

                            res.status(200).json(callBackResult);

                            await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                            return;
                        };
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    } catch (error: any) {
                        console.error(error);
                        await session.abortTransaction();
                        await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                        if (error.contextCode === 5 || !error.contextCode) {
                            if (error.type === 'chain-error' || error.contextModule === 'wasm' || error.errorClass === 'TransactionException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                return;
                            } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                                return;
                            };
                        };
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    } finally {
                        await session.endSession();
                    };
                };
            } else {
                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
            };
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};