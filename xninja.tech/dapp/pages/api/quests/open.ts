import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

function getRandomInteger(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const handler = async ({ req, res, user }: Handler) => {
    const { questName, action } = req.body;

    if (!questName || !action) {
        res.status(403).end();
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, quests: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    if (questName === 'starter_pack' && action === '_opened') {
        if (dbUser.quests.starter_pack._opened) {
            res.status(200).end();
            return;
        };

        if (
            dbUser.quests.starter_pack.join_discord !== true ||
            !dbUser.quests.starter_pack.follow ||
            !dbUser.quests.starter_pack.turn_on_notification ||
            !dbUser.quests.starter_pack.like ||
            !dbUser.quests.starter_pack.retweet
        ) {
            res.status(404).end();
            return;
        };

        const ELEM = getRandomInteger(50, 150);

        await userCollection.updateOne({
            tw_id: user.tw_id,
            'quests.starter_pack': { $exists: true },
            'quests.starter_pack._opened': { $ne: true },
            'quests.starter_pack.join_discord': true,
            'quests.starter_pack.follow': true,
            'quests.starter_pack.turn_on_notification': true,
            'quests.starter_pack.like': true,
            'quests.starter_pack.retweet': true,
        }, {
            $set: {
                'quests.starter_pack._opened': true,
                'quests.starter_pack._rewards': { tokens: { ELEM } },
            },
            $inc: { 'wallet.ELEM': ELEM },
        });

        res.status(200).json({ ELEM });
        return;
    } else if (questName === 'dojo_drill') {
        const date = new Date();

        const claim_total_days = Math.floor((dbUser.quests?.dojo_drill?.claim_at?.getTime() || 0) / (24 * 60 * 60 * 1000));
        const now_total_days = Math.floor((date?.getTime() || 0) / (24 * 60 * 60 * 1000));
        const another = dbUser.quests?.dojo_drill?.claim_at?.getTime() && claim_total_days !== now_total_days && claim_total_days < now_total_days && claim_total_days !== now_total_days - 1;

        if (action === 'day_1') {
            if (
                (typeof dbUser.quests?.dojo_drill?.day !== 'number' && !dbUser.quests?.dojo_drill?.claim_at)
                || (dbUser.quests?.dojo_drill?.day === 7 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1)
                || (typeof dbUser.quests?.dojo_drill?.day === 'number' && dbUser.quests?.dojo_drill?.claim_at && another)) {
                await userCollection.updateOne({ tw_id: user.tw_id }, { $inc: { 'inventorys.rice': 1 }, $set: { 'quests.dojo_drill': { day: 1, claim_at: date } } });

                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_2') {
            if (dbUser.quests?.dojo_drill?.day === 1 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 1 }, { $inc: { 'inventorys.rice': 2 }, $set: { 'quests.dojo_drill': { day: 2, claim_at: date } } });

                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_3') {
            if (dbUser.quests?.dojo_drill?.day === 2 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 2 }, { $inc: { 'inventorys.miso_soup': 1 }, $set: { 'quests.dojo_drill': { day: 3, claim_at: date } } });

                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_4') {
            if (dbUser.quests?.dojo_drill?.day === 3 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 3 }, { $inc: { 'wallet.ELEM': 2 }, $set: { 'quests.dojo_drill': { day: 4, claim_at: date } } });
                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_5') {
            if (dbUser.quests?.dojo_drill?.day === 4 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 4 }, { $inc: { 'inventorys.miso_soup': 2 }, $set: { 'quests.dojo_drill': { day: 5, claim_at: date } } });
                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_6') {
            if (dbUser.quests.dojo_drill?.day === 5 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 5 }, { $inc: { 'inventorys.meat': 2 }, $set: { 'quests.dojo_drill': { day: 6, claim_at: date } } });

                res.status(200).json({ claim_at: date });
            };
        } else if (action === 'day_7') {
            if (dbUser.quests?.dojo_drill?.day === 6 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                await userCollection.updateOne({ tw_id: user.tw_id, 'quests.dojo_drill.day': 6 }, { $inc: { 'wallet.ELEM': 10 }, $set: { 'quests.dojo_drill': { day: 7, claim_at: date } } });

                res.status(200).json({ claim_at: date });
            };
        };
    } else if (questName === 'exclusive_quest') {
        if (dbUser.quests.exclusive_quest._opened) {
            res.status(200).end();
            return;
        };

        if (
            !dbUser.quests.exclusive_quest.follow_injective ||
            !dbUser.quests.exclusive_quest.follow_dojoswap ||
            !dbUser.quests.exclusive_quest.like ||
            !dbUser.quests.exclusive_quest.retweet
        ) {
            res.status(404).end();
            return;
        };

        await userCollection.updateOne({
            tw_id: user.tw_id,
            'quests.exclusive_quest': { $exists: true },
            'quests.exclusive_quest._opened': { $ne: true },
            'quests.exclusive_quest.follow_injective': true,
            'quests.exclusive_quest.follow_dojoswap': true,
            'quests.exclusive_quest.like': true,
            'quests.exclusive_quest.retweet': true,
        }, {
            $set: {
                'quests.exclusive_quest._opened': true,
                'quests.exclusive_quest._rewards': { tokens: { ELEM: 30 }, foods: { rice: 3, miso_soup: 2, meat: 1 } },
            },
            $inc: { 'wallet.ELEM': 30, 'inventorys.rice': 3, 'inventorys.miso_soup': 2, 'inventorys.meat': 1 },
        });

        res.status(200).end();
        return;
    } else if (questName === 'happy_lunar_new_year' && action === '_opened') {
        if (dbUser.quests.happy_lunar_new_year._opened) {
            res.status(200).end();
            return;
        };

        if (
            !dbUser.quests.happy_lunar_new_year.tweet ||
            !dbUser.quests.happy_lunar_new_year.retweet
        ) {
            res.status(404).end();
            return;
        };

        const ELEM = getRandomInteger(10, 30);

        const result = await userCollection.updateOne({
            tw_id: user.tw_id,
            'quests.happy_lunar_new_year': { $exists: true },
            'quests.happy_lunar_new_year._opened': { $ne: true },
            'quests.happy_lunar_new_year.tweet': true,
            'quests.happy_lunar_new_year.retweet': true,
        }, {
            $set: {
                'quests.happy_lunar_new_year._opened': true,
                'quests.happy_lunar_new_year._rewards': { tokens: { ELEM } },
            },
            $inc: { 'wallet.ELEM': ELEM },
        });

        if ((result.acknowledged === true && result.modifiedCount > 0)) {
            res.status(200).json({ ELEM });
        } else {
            res.status(200).end();
        };
        return;
    };

    res.status(404).end();
};

export default middleWare(handler);