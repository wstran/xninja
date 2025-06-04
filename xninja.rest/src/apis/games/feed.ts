import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import { CONFIG_FOODS, LEVEL_NINJAS, MANA_CLASSES, CONFIG_BOOSTS } from '../../libs/game.config';
import Database from '../../libs/database';
import { ObjectId } from 'mongodb';
import queueRequest from '../../libs/queue-request';

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
    router.post("/games/feed", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { id, item } = req.body;

            if (!item || !CONFIG_FOODS[item]) {
                res.status(404).json({ status: 'BAD_REQUEST' });
                return;
            };

            const _id = new ObjectId(id);

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const userCollection = db.collection('users');
            const ninjaCollection = db.collection('ninjas');

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, boosts: 1 } });

            if (!dbUser) {
                res.status(403).end();
                return;
            };

            const dbNinja = await ninjaCollection.findOne({ _id, ownerId: req.payload.tw_id }, { projection: { _id: 0, mana: 1, farm_at: 1, class: 1, level: 1 } });

            if (!dbNinja) {
                res.status(404).json({ status: 'NINJA_NOT_FOUND' });
                return;
            };

            const now = Date.now();
            const farm_timestamp = dbNinja.farm_at?.getTime();
            const mana_timestamp = dbNinja.mana.getTime();
            const boost = getBoostData(dbUser.boosts) || 0;

            const maxMana = new Date((now + (8 * 60 * 60 * 1000) * MANA_CLASSES[dbNinja.class])).getTime();
            const newMana = new Date((now >= mana_timestamp ? now : mana_timestamp) + ((8 * 60 * 60 * 1000) * CONFIG_FOODS[item].mana)).getTime();

            const mana = new Date(newMana > maxMana ? maxMana : newMana);

            const result = await userCollection.findOneAndUpdate({ tw_id: req.payload.tw_id, inventorys: { $exists: true }, [`inventorys.${CONFIG_FOODS[item].food}`]: { $exists: true, $gte: 1 } }, { $inc: { [`inventorys.${CONFIG_FOODS[item].food}`]: -1 } }, { projection: { _id: 0, inventorys: 1 }, returnDocument: 'after' });

            if (result === null) {
                res.status(404).json({ status: 'NOT_ENOUGH_FOOD' });
                return;
            };

            const callbackData: { ninja: { mana: Date, unset_farm_at: boolean, balance?: number } } = { ninja: { mana, unset_farm_at: false } };

            if (now >= mana_timestamp) {
                const balance = farm_timestamp ? ((mana_timestamp - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

                callbackData.ninja.unset_farm_at = true;
                callbackData.ninja.balance = balance + (balance * boost / 100);

                await ninjaCollection.updateOne({ _id }, { $set: { mana }, $unset: { farm_at: true }, $inc: { balance: callbackData.ninja.balance } });
            } else {
                await ninjaCollection.updateOne({ _id }, { $set: { mana } });
            };

            res.status(200).json(callbackData);
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};