import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import queueRequest from '../../libs/queue-request';
import claim from '../../apis/blockchain/claim';
import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';
import getAppConfig from '../../app.config';
import { roundDown } from '../../libs/custom';

const [StartRequest, EndRequest] = queueRequest();

export default function (router: Router) {
    router.post("/profiles/referrals_claim", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const appConfig = await getAppConfig();

            if (!appConfig.allow_referral_claim) {
                res.status(404).json({ status: 'CANNOT_CLAIM' });
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const client = dbInstance.getClient();
            const session = client.startSession();
            const userCollection = db.collection('users');
            const userClaimCollection = db.collection('user_claims');

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, rewards: 1, privateKey: 1 } });

            if (!dbUser) {
                res.status(403).end();
                return;
            };

            const date = new Date();

            const balance = (dbUser.rewards?.ELEM as number) || 0;

            if (balance > 0) {
                const claim_elem = roundDown(balance, 2);

                const privateKey = CryptoJS.AES.decrypt(
                    dbUser.privateKey,
                    process.env.SECRET_KEY as string
                ).toString(CryptoJS.enc.Utf8);

                const insert = await userClaimCollection.insertOne({
                    tw_id: req.payload.tw_id,
                    amount: ethers.parseEther(claim_elem).toString(),
                    type: 'referral',
                    created_at: new Date(),
                    status: 'pending'
                });

                try {
                    session.startTransaction();
                    const result = await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { 'rewards.claim_at': date }, $inc: { 'rewards.ELEM': -balance } }, { session });

                    if (result.acknowledged === true && result.modifiedCount > 0) {

                        const txResponse = await claim(privateKey, Number(claim_elem));

                        await session.commitTransaction();

                        await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });

                        res.status(200).json({ balance: Number(claim_elem) });
                        return;
                    };

                    res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                } catch (error: any) {
                    await session.abortTransaction();
                    await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                    console.error("Transaction failed:", error);
                    if (error.contextCode === 5 || !error.contextCode) {
                        if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                        };
                    };
                    res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    return;
                } finally {
                    await session.endSession();
                };
            } else {
                res.status(404).json({ status: 'NO_REWARDS_TO_CLAIM' });
            };
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};