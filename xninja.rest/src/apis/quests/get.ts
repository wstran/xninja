import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';

export default function (router: Router) {
    router.post("/quests/get", middleWare, async (req: RequestWithUser, res) => {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, quests: 1 } });

        if (!dbUser) {
            res.status(403).end();
            return;
        }

        res.status(200).json(dbUser.quests);
    });
};