import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import { LEVEL_NINJAS, CONFIG_BOOSTS } from '../../libs/game.config';
import { ObjectId } from 'mongodb';
import queueRequest from '../../libs/queue-request';
import claim from '../../apis/blockchain/claim';
import CryptoJS from "crypto-js";
import { ethers } from 'ethers';
import getAppConfig from '../../app.config';
import { roundDown } from '../../libs/custom';

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
    router.post("/games/claim", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const appConfig = await getAppConfig();

            if (!appConfig.allow_earn_claim) {
                res.status(404).json({ status: 'CANNOT_CLAIM' });
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const client = dbInstance.getClient();
            const session = client.startSession();
            const userCollection = db.collection('users');
            const ninjaCollection = db.collection('ninjas');
            const userClaimCollection = db.collection('user_claims');

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, claim_at: 1, boosts: 1, privateKey: 1 } });

            if (!dbUser) {
                res.status(403).end();
                return;
            };

            const dbNinjas = await ninjaCollection.find({ ownerId: req.payload.tw_id }).toArray();

            if (dbNinjas.length === 0) {
                res.status(404).json({ status: 'NINJA_NOT_FOUND' });
                return;
            };

            let total_elem = 0;
            const new_ninjas = [];
            const bulkOps = [];

            const date = new Date();
            const boost = getBoostData(dbUser.boosts) || 0;

            for (let i = 0; i < dbNinjas.length; ++i) {
                const _id = new ObjectId(dbNinjas[i]._id);
                const farm_timestamp = dbNinjas[i].farm_at?.getTime();
                const mana_timestamp = dbNinjas[i].mana.getTime();
                const balance = dbNinjas[i].balance || 0;

                total_elem += balance;

                if (date.getTime() >= mana_timestamp) {
                    const balance = farm_timestamp ? ((mana_timestamp - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinjas[i].class][dbNinjas[i].level].farm_speed_hour : 0;

                    total_elem += balance + (balance * boost / 100);

                    new_ninjas.push({ _id, balance: 0, farm_at: null });

                    bulkOps.push({
                        updateOne: {
                            filter: { _id },
                            update: { $set: { balance: 0 }, $unset: { farm_at: true } }
                        }
                    });
                } else {
                    const balance = farm_timestamp ? ((date.getTime() - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinjas[i].class][dbNinjas[i].level].farm_speed_hour : 0;

                    total_elem += balance + (balance * boost / 100);

                    new_ninjas.push({ _id, balance: 0, farm_at: date });

                    bulkOps.push({
                        updateOne: {
                            filter: { _id },
                            update: { $set: { balance: 0, farm_at: date } }
                        }
                    });
                };
            };

            const claim_elem = roundDown(total_elem, 2);

            if (total_elem > 0) {
                const privateKey = CryptoJS.AES.decrypt(
                    dbUser.privateKey,
                    process.env.SECRET_KEY as string
                ).toString(CryptoJS.enc.Utf8);

                const insert = await userClaimCollection.insertOne({
                    tw_id: req.payload.tw_id,
                    amount: ethers.parseEther(claim_elem).toString(),
                    type: 'earn',
                    created_at: new Date(),
                    status: 'pending'
                });

                try {
                    session.startTransaction();

                    for (let i = 0; i < bulkOps.length; i += 1000)
                        await ninjaCollection.bulkWrite(bulkOps.slice(i, i + 1000), { session });

                    const txResponse = await claim(privateKey, Number(claim_elem));

                    await session.commitTransaction();

                    await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                } catch (error: any) {
                    await session.abortTransaction();
                    await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                    console.error("Transaction failed:", error);
                    if (error.contextCode === 5 || !error.contextCode) {
                        if (error.type === 'chain-error' || error.errorClass === 'TransactionException') {
                            if (error.contextModule === 'wasm') {
                                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                            } else if (error.contextModule === 'sdk') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            };
                        } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                        };
                    };
                    res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    return;
                } finally {
                    await session.endSession();
                };
            };

            res.status(200).json({ claim_at: date, total_elem: Number(claim_elem), new_ninjas });
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};