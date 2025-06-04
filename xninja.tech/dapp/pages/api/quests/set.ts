import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';
import { JWT } from 'next-auth/jwt';
import * as crypto from 'crypto';

const apiPath = '/api/quests/set';

const questUrls: { [key: string]: string } = {
    starter_pack_join_discord: 'https://discord.gg/xninja',
    starter_pack_follow: 'https://twitter.com/intent/follow?region=follow_link&screen_name=xninja_tech',
    starter_pack_turn_on_notification: 'https://twitter.com/xninja_tech',
    starter_pack_like: 'https://twitter.com/intent/like?tweet_id=1750166319087910912',
    starter_pack_retweet: 'https://twitter.com/intent/retweet?tweet_id=1750166319087910912',
    exclusive_quest_follow_injective: 'https://twitter.com/intent/follow?region=follow_link&screen_name=Injective_',
    exclusive_quest_follow_dojoswap: 'https://twitter.com/intent/follow?region=follow_link&screen_name=Dojo_Swap',
    exclusive_quest_like: 'https://twitter.com/intent/like?tweet_id=1753011397389385995',
    exclusive_quest_retweet: 'https://twitter.com/intent/retweet?tweet_id=1753011397389385995',
    happy_lunar_new_year_tweet: 'https://twitter.com/intent/tweet?text=Celebrating+the+Lunar+New+Year+with+%23xNinja+and+%23Injective%21+%F0%9F%A5%B7+%0A%0AWishing+all+Ninjas+prosperity+and+excitement+in+the+Year+of+the+Dragon+%F0%9F%90%89',
    happy_lunar_new_year_like: 'https://twitter.com/intent/like?tweet_id=1756194800012083400',
    happy_lunar_new_year_retweet: 'https://twitter.com/intent/retweet?tweet_id=1756194800012083400',

};

const questOptions: { [key: string]: string[] } = {
    starter_pack: ['join_discord', 'follow', 'turn_on_notification', 'like', 'retweet'],
    exclusive_quest: ['follow_injective', 'follow_dojoswap', 'like', 'retweet'],
}

const verifySignature = (questName: string, action: string, timestamp: number, queryId: string, user: JWT) => {
    const questUrl = questUrls[questName + '_' + action];
    const data = `timestamp=${timestamp}&url=${apiPath}&questName=${questName}&questUrl=${questUrl}&action=${action}`;
    const secretKey = crypto
        .createHash('sha256')
        //@ts-ignore
        .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
        .digest('hex');

    const signature = crypto.createHmac('sha256', secretKey).update(data).digest('hex');

    return signature === queryId;
};

const handler = async ({ req, res, user }: Handler) => {
    const { questName, action, state, timestamp, queryId } = req.body;

    if (typeof questName !== 'string' || !action || !timestamp || !queryId || !verifySignature(questName, action, timestamp, queryId, user)) {
        res.status(403).end();
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    if (questName === 'starter_pack') {
        if ((action === 'join_discord' && state === 'unchecked') || action === 'follow' || action === 'turn_on_notification' || action === 'like' || action === 'retweet') {
            if ((action === 'join_discord' && state === 'unchecked')) {
                await userCollection.updateOne({ tw_id: user.tw_id }, { $set: { [`quests.${questName}.${action}`]: 'unchecked' } });
            } else {
                await userCollection.updateOne({ tw_id: user.tw_id }, { $set: { [`quests.${questName}.${action}`]: true } });
            };

            res.status(200).end();
            return;
        };
    } else if (questName === 'happy_lunar_new_year') {
        if (action === 'tweet' || action === 'like' || action === 'retweet') {
            await userCollection.updateOne({ tw_id: user.tw_id }, { $set: { [`quests.${questName}.${action}`]: true } });

            res.status(200).end();
            return;
        };
    };

    res.status(404).end();
};

export default middleWare(handler);
