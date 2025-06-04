import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';
import { ObjectId } from 'mongodb';
import { LEVEL_NINJAS, CONFIG_BOOSTS } from '@/libs/game.config';

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

const handler = async ({ req, res, user }: Handler) => {
    /* const { id, currentLevel } = req.body;

    if (typeof currentLevel !== 'number') {
        res.status(404).json({ status: 'BAD_REQUEST' });
        return;
    };

    const _id = new ObjectId(id);

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const ninjaCollection = db.collection('ninjas');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, boosts: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    const dbNinja = await ninjaCollection.findOne({ _id, ownerId: user.tw_id }, { projection: { _id: 0 } });

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

    const price = LEVEL_NINJAS[dbNinja.class][dbNinja.level + 1]?.cost;

    const boost = getBoostData(dbUser.boosts) || 0;

    if (price) {
        const result = await userCollection.findOneAndUpdate({ tw_id: user.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price } }, { projection: { _id: 0, wallet: 1, referral_code: 1 }, returnDocument: 'after' });

        if (result === null) {
            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
            return;
        };

        const date = Date.now();
        const farm_timestamp = dbNinja.farm_at?.getTime();
        const mana_timestamp = dbNinja.mana.getTime();

        const callBackResult = { ...(result.wallet || { ELEM: 0 }) };

        if (date >= mana_timestamp) {
            const balance = farm_timestamp ? ((mana_timestamp - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } });
        } else {
            const balance = farm_timestamp ? ((date - farm_timestamp) / (60 * 60 * 1000)) * LEVEL_NINJAS[dbNinja.class][dbNinja.level].farm_speed_hour : 0;

            callBackResult.balance = balance > 0 ? balance + (balance * boost / 100) : 0;

            await ninjaCollection.updateOne({ _id }, { $unset: { farm_at: true }, $inc: { level: 1, balance: callBackResult.balance } });
        };

        if (result.referral_code?.startsWith('xninja_')) {
            await userCollection.bulkWrite([
                {
                    updateOne: {
                        filter: {
                            invite_code: result.referral_code,
                            user_refs: { $elemMatch: { tw_id: user.tw_id, rewards: { $exists: false } } }
                        },
                        update: { $set: { 'user_refs.$.rewards': {} } }
                    }
                },
                {
                    updateOne: {
                        filter: {
                            invite_code: result.referral_code,
                            'user_refs.tw_id': user.tw_id,
                        },
                        update: {
                            $inc: { 'wallet.ELEM': price * 2 / 100, 'user_refs.$[elem].rewards.ELEM': price * 2 / 100 },
                        },
                        arrayFilters: [{ 'elem.tw_id': user.tw_id }]
                    }
                }
            ]);
        };

        res.status(200).json(callBackResult);
    } else {
        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
    }; */
};

export default middleWare(handler);