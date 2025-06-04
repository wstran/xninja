import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import { ObjectId } from 'mongodb';
import queueRequest from '../../libs/queue-request';

const [StartRequest, EndRequest] = queueRequest();

export default function (router: Router) {
    router.post("/games/farm", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { id } = req.body;

            const _id = new ObjectId(id);

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const ninjaCollection = db.collection('ninjas');

            const dbNinja = await ninjaCollection.findOne({ _id, ownerId: req.payload.tw_id }, { projection: { _id: 0, mana: 1, farm_at: 1 } });

            if (!dbNinja) {
                res.status(404).json({ status: 'NINJA_NOT_FOUND' });
                return;
            };

            const now = Date.now();
            const mana_timestamp = dbNinja.mana.getTime();

            if (now >= mana_timestamp) {
                res.status(404).json({ status: 'NINJA_RUNS_OUT_OF_MANA' });
                return;
            };

            if (dbNinja.farm_at) {
                res.status(404).json({ status: 'NINJA_ALREADY_FARMING' });
                return;
            };

            const farm_at = new Date();

            await ninjaCollection.updateOne({ _id }, { $set: { farm_at } });

            res.status(200).json({ farm_at });
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};