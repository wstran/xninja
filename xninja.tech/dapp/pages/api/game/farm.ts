import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';
import { ObjectId } from 'mongodb';

const handler = async ({ req, res, user }: Handler) => {
    /* const { id } = req.body;

    const _id = new ObjectId(id);

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const ninjaCollection = db.collection('ninjas');

    const dbNinja = await ninjaCollection.findOne({ _id, ownerId: user.tw_id }, { projection: { _id: 0, mana: 1, farm_at: 1 } });

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

    res.status(200).json({ farm_at }); */
};

export default middleWare(handler);
