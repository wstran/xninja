import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import { ObjectId } from 'mongodb';
import { LEVEL_NINJAS, CONFIG_BOOSTS } from '../../libs/game.config';
import queueRequest from '../../libs/queue-request';
import { PrivateKey } from '@injectivelabs/sdk-ts';
import { BigNumberInWei } from '@injectivelabs/utils';
import { CONTRACT_ADDRESS_ELEM, POCKET_ADDRESS, getCW20Balance } from '../../apis/blockchain/config';
import { transferCW20, transferNative } from '../../libs/blockchain';
import CryptoJS from 'crypto-js';

const [StartRequest, EndRequest] = queueRequest();

function getBoostData(boosts: { count: number, date: Date } | null) {
    if (!boosts) return null;

    const currentDate = new Date();

    const sortedKeys = Object.keys(CONFIG_BOOSTS).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < sortedKeys.length; i++) {
        if (boosts.count < sortedKeys[i]) {
            const data = CONFIG_BOOSTS[sortedKeys[i - 1]];

            return (data && ((currentDate.getTime() - boosts.date.getTime()) / (24 * 60 * 60 * 1000)) < data.day) ? data.boost : null;
        };
    };

    return CONFIG_BOOSTS[sortedKeys[sortedKeys.length - 1]].boost;
};

export default function (router: Router) {
    router.post("/games/upgrade", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { id, currentLevel } = req.body;

            if (typeof currentLevel !== 'number') {
                res.status(404).json({ status: 'BAD_REQUEST' });
                return;
            };

            const _id = new ObjectId(id);

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const client = dbInstance.getClient();
            const session = client.startSession();
            const userCollection = db.collection('users');
            const ninjaCollection = db.collection('ninjas');
            const userActionCollection = db.collection('user_actions');
            const offChainLogCollection = db.collection('offchain_logs');

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1, boosts: 1, privateKey: 1 } });

            if (!dbUser || !dbUser.privateKey) {
                res.status(403).end();
                return;
            };

            const dbNinja = await ninjaCollection.findOne({ _id, ownerId: req.payload.tw_id }, { projection: { _id: 0 } });

            if (!dbNinja) {
                res.status(404).json({ status: 'NINJA_NOT_FOUND' });
                return;
            };

            if (dbNinja.level !== currentLevel) {
                res.status(404).json({ status: 'BAD_REQUEST' });
                return;
            };

            if (dbNinja.level === 50) {
                res.status(404).json({ status: 'NINJA_MAX_LEVEL' });
                return;
            };

            const privateKey = CryptoJS.AES.decrypt(
                dbUser.privateKey,
                process.env.SECRET_KEY as string
            ).toString(CryptoJS.enc.Utf8);

            const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

            const elem_balance = new BigNumberInWei((await getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)).balance).toBase().toNumber();

            const userELEM = dbUser.wallet?.ELEM || 0;
            const price = LEVEL_NINJAS[dbNinja.class][dbNinja.level + 1]?.cost;

            const boost = getBoostData(dbUser.boosts) || 0;

            if ((userELEM + elem_balance) >= price) {
                if (userELEM >= price) {
                    try {
                        if (dbNinja.level >= 4) {
                            const txResponse = await transferNative(privateKey, POCKET_ADDRESS, 0.000000000000000001);

                            if (!txResponse || txResponse.code !== 0) {
                                await userActionCollection.insertOne({ tw_id: req.payload.tw_id, type: 'upgrade', message: 'offchain', txResponse, failed_at: new Date(), created_at: new Date(), status: 'failed' });
                                res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                                return;
                            };
                        };

                        const result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price } }, { projection: { _id: 0, wallet: 1, referral_code: 1 }, returnDocument: 'after' });

                        if (result === null) {
                            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                            return;
                        };

                        const date = Date.now();
                        const farm_timestamp = dbNinja.farm_at?.getTime();
                        const mana_timestamp = dbNinja.mana.getTime();

                        const callBackResult = { ...result.wallet, ELEM: (result.wallet?.ELEM || 0) + elem_balance };

                        if (date >= mana_timestamp) {
                            const balance = farm_timestamp ? ((mana_timestamp - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

                            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

                            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } });
                        } else {
                            const balance = farm_timestamp ? ((date - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

                            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

                            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } });
                        };

                        await offChainLogCollection.insertOne({ action: 'upgrade', tw_id: req.payload.tw_id, price, created_at: new Date() });

                        res.status(200).json(callBackResult);
                    } catch (error: any) {
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
                    };
                } else {
                    const price_onchain = price - userELEM;

                    const insert = await userActionCollection.insertOne({ tw_id: req.payload.tw_id, type: 'upgrade', price_onchain, data: dbNinja, created_at: new Date(), status: 'pending' });

                    try {
                        session.startTransaction();

                        let result;

                        if (userELEM > 0) {
                            result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: userELEM } }, { $inc: { 'wallet.ELEM': -userELEM } }, { projection: { _id: 0, wallet: 1, referral_code: 1 }, returnDocument: 'after', session });

                            if (result === null) {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                return;
                            };
                        } else {
                            result = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1, referral_code: 1 }, session });
                        };

                        const date = Date.now();
                        const farm_timestamp = dbNinja.farm_at?.getTime();
                        const mana_timestamp = dbNinja.mana.getTime();

                        const callBackResult = { ...result?.wallet, ELEM: (result?.wallet?.ELEM || 0) + (elem_balance - price_onchain) };

                        if (date >= mana_timestamp) {
                            const balance = farm_timestamp ? ((mana_timestamp - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

                            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

                            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } }, { session });
                        } else {
                            const balance = farm_timestamp ? ((date - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

                            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

                            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } }, { session });
                        };

                        if (result?.referral_code?.startsWith('xninja_')) {
                            const bulkOps: any[] = [
                                {
                                    updateOne: {
                                        filter: {
                                            invite_code: result.referral_code,
                                            user_refs: { $elemMatch: { tw_id: req.payload.tw_id, rewards: { $exists: false } } }
                                        },
                                        update: { $set: { 'user_refs.$.rewards': {} } }
                                    }
                                },
                                {
                                    updateOne: {
                                        filter: {
                                            invite_code: result.referral_code,
                                            'user_refs.tw_id': req.payload.tw_id,
                                        },
                                        update: {
                                            $inc: { 'rewards.ELEM': price_onchain * 2 / 100, 'user_refs.$[elem].rewards.ELEM': price_onchain * 2 / 100 },
                                        },
                                        arrayFilters: [{ 'elem.tw_id': req.payload.tw_id }]
                                    }
                                }
                            ];

                            if (dbNinja.level >= 5) {
                                const nextDay = new Date();

                                nextDay.setDate(nextDay.getDate() + 21);

                                bulkOps.push({
                                    updateOne: {
                                        filter: {
                                            invite_code: result.referral_code,
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
                                            invite_code: result.referral_code,
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
                                            invite_code: result.referral_code,
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
                            await userActionCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                        };

                        await offChainLogCollection.insertOne({ action: 'upgrade', tw_id: req.payload.tw_id, price: userELEM, created_at: new Date() });

                        await session.commitTransaction();

                        res.status(200).json(callBackResult);

                        await userActionCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                    } catch (error: any) {
                        console.error(error);
                        await session.abortTransaction();
                        await userActionCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                        if (error.contextCode === 5 || !error.contextCode) {
                            if (error.type === 'chain-error' || error.errorClass === 'TransactionException') {
                                if (error.contextModule === 'wasm') {
                                    res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                } else if (error.contextModule === 'sdk') {
                                    res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                                };
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