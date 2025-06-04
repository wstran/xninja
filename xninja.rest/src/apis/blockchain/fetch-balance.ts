import { Router } from 'express';
import { RequestWithUser, middleWare } from "../../config";
import { CONTRACT_ADDRESS_XNJ, CONTRACT_ADDRESS_ELEM, getBalance, getCW20Balance } from './config';
import Database from '../../libs/database';

export default function (router: Router) {
    router.get(
        "/blockchain/fetch-balance",
        middleWare,
        async (req: RequestWithUser, res, next) => {
            try {
                if (!req.payload) {
                    res.sendStatus(403);
                    return;
                };

                let injectiveAddress = req.query.injectiveAddress;

                if (!injectiveAddress || typeof injectiveAddress !== "string") {
                    res.status(400).json({ message: "Valid injective address is required" });
                    return;
                };

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const userCollection = db.collection('users');

                const [INJ, XNJ, ELEM] = await Promise.all([getBalance(injectiveAddress, 'inj'), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)]);

                const result = { INJ, XNJ, ELEM };

                await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { onchain_balances: { balances: result, updated_at: new Date() } } });

                res.status(200).json(result);
            } catch (error) {
                console.error(error);
                res.status(500).end();
            } finally {
                next();
            }
        }
    );
};
