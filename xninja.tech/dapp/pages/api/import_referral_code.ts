import { ErrorCode } from '@/libs/ErrorCode';
import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

const handler = async ({ req, res, user }: Handler) => {
    const { referral_code } = req.body;

    if (!referral_code || !referral_code.startsWith('xninja_')) {
        res.status(404).end();
        return;
    }

    if (referral_code === 'xninja_invite') {
        res.status(500).end();
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const countUser = await userCollection.countDocuments({ invite_code: referral_code });

    if (countUser === 1) {
        await userCollection.updateOne({ tw_id: user.tw_id }, { $set: { referral_code } });
        await userCollection.updateOne({ invite_code: referral_code }, { $push: { user_refs: { tw_id: user.tw_id, referral_date: new Date() } } });
        res.status(200).end();
    } else {
        res.status(404).end();
    }
};

export default middleWare(handler);