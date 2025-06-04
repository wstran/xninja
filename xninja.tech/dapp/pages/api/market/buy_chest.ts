import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

type MANA_CLASSES = 'metal' | 'wood' | 'fire' | 'water' | 'earth';
type CHESTS = { chest: 'ninja_chest' | 'warrior_chest' | 'knight_chest' | 'lord_chest' | 'master_chest' };

const CONFIG_CHESTS = {
    ninja_chest: {
        price: 0,
        level: 0,
        name: 'Ninja Chest',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'] as MANA_CLASSES[],
    },
    warrior_chest: {
        price: 276,
        level: 5,
        name: 'Warrior Chest',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'] as MANA_CLASSES[],
    },
    knight_chest: {
        price: 3420,
        level: 16,
        name: 'Knight Chest',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'] as MANA_CLASSES[],
    },
    lord_chest: {
        price: 36288,
        level: 30,
        name: 'Lord Chest',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'] as MANA_CLASSES[],
    },
    master_chest: {
        price: 253911,
        level: 50,
        name: 'Master Chest',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'] as MANA_CLASSES[],
    },
};

const manaClasses = {
    metal: 5,
    wood: 4,
    fire: 4,
    water: 3,
    earth: 3,
};

function getRandomClass(classes: MANA_CLASSES[]): MANA_CLASSES {
    const randomIndex = Math.floor(Math.random() * classes.length);
    return classes[randomIndex];
};

const handler = async ({ req, res, user }: Handler) => {
    /* const { chest } = req.body as CHESTS;

    if (typeof chest !== 'string' || !CONFIG_CHESTS[chest]) {
        res.status(404).json({ status: 'BAD_REQUEST' });
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const ninjaCollection = db.collection('ninjas');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, wallet: 1, referral_code: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    const userELEM = dbUser.wallet?.ELEM || 0;
    const { price, level, classes } = CONFIG_CHESTS[chest];

    if (userELEM >= price) {
        const chest_class = getRandomClass(classes);

        const mana = new Date();

        mana.setHours(mana.getHours() + (8 * manaClasses[chest_class]));

        const chestData = { ownerId: user.tw_id, class: chest_class, level, mana, created_at: new Date() };


        const result = await userCollection.findOneAndUpdate({ tw_id: user.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after' });

        if (result === null) {
            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
            return;
        };

        const insert = await ninjaCollection.insertOne(chestData);

        if (insert.acknowledged === true) {
            await userCollection.updateOne({ tw_id: user.tw_id }, { $push: { ninjas: { id: insert.insertedId.toHexString(), created_at: chestData.created_at } } });
            if (dbUser.referral_code?.startsWith('xninja_')) {
                await userCollection.bulkWrite([
                    {
                        updateOne: {
                            filter: {
                                invite_code: dbUser.referral_code,
                                user_refs: { $elemMatch: { tw_id: user.tw_id, rewards: { $exists: false } } }
                            },
                            update: { $set: { 'user_refs.$.rewards': {} } }
                        }
                    },
                    {
                        updateOne: {
                            filter: {
                                invite_code: dbUser.referral_code,
                                'user_refs.tw_id': user.tw_id,
                            },
                            update: {
                                $inc: { 'wallet.ELEM': price * 2 / 100, 'user_refs.$[elem].rewards.ELEM': price * 2 / 100 }
                            },
                            arrayFilters: [{ 'elem.tw_id': user.tw_id }]
                        }
                    }
                ]);
            };
        };

        const callBackResult = { ...(result.wallet || { ELEM: 0 }), class: chestData.class, level: chestData.level, mana: chestData.mana };

        res.status(200).json(callBackResult);
    } else {
        res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
    }; */
};

export default middleWare(handler);