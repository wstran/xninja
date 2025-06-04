import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

type FOODS = { food: 'rice' | 'miso_soup' | 'meat', count: number };

const CONFIG_FOODS = {
    rice: {
        price: 0.5,
    },
    miso_soup: {
        price: 1,
    },
    meat: {
        price: 1.5
    },
};

const handler = async ({ req, res, user }: Handler) => {
    /* const { food, count } = req.body as FOODS;

    if (
        typeof food !== 'string'
        || typeof count !== 'number'
        || count < 1
        || count > 1000
        || !CONFIG_FOODS[food]
    ) {
        res.status(404).json({ status: 'BAD_REQUEST' });
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, wallet: 1, referral_code: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    const price = CONFIG_FOODS[food].price * count;

    if (dbUser.wallet?.ELEM && dbUser.wallet.ELEM >= price) {
        const result = await userCollection.findOneAndUpdate({ tw_id: user.tw_id, wallet: { $exists: true }, 'wallet.ELEM': { $exists: true, $gte: price } }, { $inc: { 'wallet.ELEM': -price, [`inventorys.${food}`]: count } }, { projection: { _id: 0, wallet: 1 }, returnDocument: 'after' });

        if (result === null) {
            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
            return;
        };

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

        res.status(200).json(result.wallet || { ELEM: 0 });
    } else {
        res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
    }; */
};

export default middleWare(handler);