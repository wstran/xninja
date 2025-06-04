import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

const handler = async ({ res, user }: Handler) => {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { _id: 0, user_refs: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    }

    if (dbUser.user_refs) {
        if (dbUser.user_refs.length > 1) {
            dbUser.user_refs.sort((a: { referral_date: Date }, b: { referral_date: Date }) => b.referral_date.getTime() - a.referral_date.getTime());
        }

        const referrals = dbUser.user_refs;

        const userIds = referrals.map((i: { tw_id: string }) => i.tw_id);

        const users = await userCollection
            .find({ tw_id: { $in: userIds } })
            .project({ _id: 0, tw_id: 1, username: 1 })
            .toArray();

        for (let i = 0; i < users.length; ++i) {
            const { tw_id, username } = users[i];

            const dbUserIndex = referrals.findIndex((ref: { tw_id: string }) => ref.tw_id === tw_id);

            if (dbUserIndex !== -1) {
                referrals[dbUserIndex].username = username;
            }
        }

        res.status(200).json(referrals);
        return;
    }

    res.status(200).json([]);
};

export default middleWare(handler);
