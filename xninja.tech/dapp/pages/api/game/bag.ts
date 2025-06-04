import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

const handler = async ({ res, user }: Handler) => {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, inventorys: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    res.status(200).json(dbUser.inventorys || { rice: 0, miso_soup: 0, meat: 0 });
};

export default middleWare(handler);
