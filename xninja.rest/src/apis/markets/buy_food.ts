import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import queueRequest from '../../libs/queue-request';
import { CONTRACT_ADDRESS_ELEM, POCKET_ADDRESS, getCW20Balance } from '../blockchain/config';
import CryptoJS from 'crypto-js';
import { PrivateKey } from '@injectivelabs/sdk-ts';
import { BigNumberInWei } from '@injectivelabs/utils';
import { transferCW20, transferNative } from '../../libs/blockchain';

const [StartRequest, EndRequest] = queueRequest();

type FOODS = { food: 'rice' | 'miso_soup' | 'meat', count: number };

const CONFIG_FOODS = {
    rice: {
        price: 0.5,
    },
    miso_soup: {
        price: 1,
    },
    meat: {
        price: 1.5
    },
};

export default function (router: Router) {
    router.post("/markets/buy_food", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { food, count } = req.body as FOODS;

            if (
                typeof food !== 'string'
                || typeof count !== 'number'
                || count < 1
                || count > 1000
                || !CONFIG_FOODS[food]
            ) {
                res.status(404).json({ status: 'BAD_REQUEST' });
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const client = dbInstance.getClient();
            const session = client.startSession();
            const userCollection = db.collection('users');
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
            const price = CONFIG_FOODS[food].price * count;

            if ((userELEM || elem_balance) && (userELEM + elem_balance) >= price) {
                if (userELEM >= price) {
                    try {
                        const txResponse = await transferNative(privateKey, POCKET_ADDRESS, 0.000000000000000001);

                        if (!txResponse || txResponse.code !== 0) {
                            await userMarketCollection.insertOne({ tw_id: req.payload.tw_id, type: 'buy_food', data: { food, count }, price_onchain: 0, message: 'offchain', failed_at: new Date(), created_at: new Date(), status: 'failed' });
                            res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                            return;
                        };

                        if (!txResponse || txResponse.code !== 0) return;

                        const result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price, [`inventorys.${food}`]: count } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after' });

                        if (result === null) {
                            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                            return;
                        };

                        await offChainLogCollection.insertOne({ action: 'buy_food', tw_id: req.payload.tw_id, price, count, created_at: new Date() });

                        res.status(200).json({ ...result.wallet, ELEM: (result.wallet?.ELEM || 0) + elem_balance });
                    } catch (error: any) {
                        if (error.contextCode === 5 || !error.contextCode) {
                            if (error.type === 'chain-error' || error.contextModule === 'wasm' || error.errorClass === 'TransactionException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            };
                        };

                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    };
                } else {
                    const price_onchain = price - userELEM;
                    const insert = await userMarketCollection.insertOne({ tw_id: req.payload.tw_id, type: 'buy_food', data: { food, count }, price_onchain, created_at: new Date(), status: 'pending' });

                    try {
                        session.startTransaction();

                        let result;

                        result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: userELEM } }, { $inc: { 'wallet.ELEM': -userELEM, [`inventorys.${food}`]: count } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after', session });

                        if (result === null) {
                            if (userELEM !== 0) {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                                return;
                            };
                            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $inc: { [`inventorys.${food}`]: count } }, { session });
                            result = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, wallet: 1 }, session });
                        };

                        await offChainLogCollection.insertOne({ action: 'buy_food', tw_id: req.payload.tw_id, type: 'onchain & offchain', price: userELEM, count, created_at: new Date() }, { session });

                        if (dbUser.referral_code?.startsWith('xninja_')) {
                            await userCollection.bulkWrite([
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
                                }
                            ], { session });
                        };

                        const txResponse = await transferCW20(privateKey, CONTRACT_ADDRESS_ELEM, POCKET_ADDRESS, price_onchain);

                        if (txResponse && txResponse.code === 0) {
                            await session.commitTransaction();
                        } else {
                            await session.abortTransaction();
                            await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, failed_at: new Date(), status: 'failed' } });
                        };

                        await session.commitTransaction();

                        await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });

                        res.status(200).json({ ...result?.wallet, ELEM: (result?.wallet?.ELEM || 0) + (elem_balance - price_onchain) });
                    } catch (error: any) {
                        console.error(error);
                        await session.abortTransaction();
                        await userMarketCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
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