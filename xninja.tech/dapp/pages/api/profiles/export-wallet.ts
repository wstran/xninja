import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';
import CryptoJS from 'crypto-js';

const handler = async ({ res, user }: Handler) => {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, quests: 1, privateKey: 1 } });
    const bytes = CryptoJS.AES.decrypt(dbUser?.privateKey, process.env.SECRET_KEY as string);
    const decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    res.status(200).json(decryptedPrivateKey);
};

export default middleWare(handler);
