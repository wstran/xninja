import dotenv from 'dotenv';
import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

dotenv.config();

const handler = async ({ res, user }: Handler) => {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const count = await userCollection.countDocuments({ tw_id: user.tw_id, discordId: { $exists: true } });

    res.status(200).json({ status: count === 1 });
};

export default middleWare(handler);
