import Database from '@/libs/database';
import { LEVEL_NINJAS, CONFIG_BOOSTS } from '@/libs/game.config';
import middleWare, { Handler } from '@/libs/middleWare';
import { ObjectId } from 'mongodb';

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

const handler = async ({ res, user }: Handler) => {
    /* const dbInstance = Database.getInstance();
    const client = dbInstance.getClient();
    const session = client.startSession();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const ninjaCollection = db.collection('ninjas');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, boosts: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    const dbNinjas = await ninjaCollection.find({ ownerId: user.tw_id }).toArray();

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

    if (total_elem > 0) {
        try {
            session.startTransaction();
            for (let i = 0; i < bulkOps.length; i += 1000)
                await ninjaCollection.bulkWrite(bulkOps.slice(i, i + 1000));

            await userCollection.updateOne({ tw_id: user.tw_id }, { $inc: { 'wallet.ELEM': total_elem } });
            await session.commitTransaction();
        } catch (error) {
            console.error("Transaction failed:", error);
            await session.abortTransaction();
            res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
            return;
        } finally {
            session.endSession();
        };
    };

    res.status(200).json({ total_elem, new_ninjas }); */
};

export default middleWare(handler);