import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser, PAYLOAD } from '../../config';
import Database from '../../libs/database';
import CryptoJS from 'crypto-js';
import getAppConfig from '../../app.config';

export default function (router: Router) {
    router.post("/quests/set", middleWare, async (req: RequestWithUser, res) => {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const { questName, action, state, timestamp, queryId } = req.body;

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');
        /* const appConfig = await getAppConfig();

        const questUrls: { [key: string]: string } = {
            dojo_launchpad_follow_dojoswap: appConfig.data.quests.dojo_launchpad.tasks.follow_dojoswap.questUrls,
            dojo_launchpad_follow_xninja: appConfig.data.quests.dojo_launchpad.tasks.follow_xninja.questUrls,
            dojo_launchpad_like: appConfig.data.quests.dojo_launchpad.tasks.like.questUrls,
            dojo_launchpad_retweet: appConfig.data.quests.dojo_launchpad.tasks.retweet.questUrls,
            dojo_launchpad_tweet: appConfig.data.quests.dojo_launchpad.tasks.tweet.questUrls,
            dojo_launchpad_join_dojoswap_telegram: appConfig.data.quests.dojo_launchpad.tasks.join_dojoswap_telegram.questUrls,
            starter_pack_join_discord: appConfig.data.quests.starter_pack.tasks.join_discord.questUrls,
            starter_pack_follow: appConfig.data.quests.starter_pack.tasks.follow.questUrls,
            starter_pack_turn_on_notification: appConfig.data.quests.starter_pack.tasks.turn_on_notification.questUrls,
            starter_pack_like: appConfig.data.quests.starter_pack.tasks.like.questUrls,
            starter_pack_retweet: appConfig.data.quests.starter_pack.tasks.retweet.questUrls,
        };

        const verifySignature = (questName: string, action: string, timestamp: number, queryId: string, payload: PAYLOAD) => {
            const jsonQuestUrl = JSON.stringify(questUrls[questName + '_' + action]);
            const data = `timestamp${timestamp + Number(process.env.SIGN_CODE)}${timestamp}&questName${timestamp + Number(process.env.SIGN_CODE)}${questName}&questUrl${timestamp + Number(process.env.SIGN_CODE)}${jsonQuestUrl}&action${timestamp + Number(process.env.SIGN_CODE)}${action}`;

            const secretKey = CryptoJS.SHA256(String(jsonQuestUrl + payload?.tw_id)).toString(CryptoJS.enc.Hex);

            const signature = CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Hex);

            return signature === queryId;
        }; */

        if (!questName || !action || !timestamp || !queryId /* || !verifySignature(questName, action, timestamp, queryId, req.payload) */) {
            res.status(403).end();
            return;
        };

        if (questName === 'starter_pack') {
            if ((action === 'join_discord' && state === 'unchecked') || action === 'follow' || action === 'turn_on_notification' || action === 'like' || action === 'retweet') {
                if ((action === 'join_discord' && state === 'unchecked')) {
                    await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${questName}.${action}`]: 'unchecked' } });
                } else {
                    await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${questName}.${action}`]: true } });
                };

                res.status(200).end();
                return;
            };
        } else if (questName === 'injective_quest_social_task') {
            if ((action === 'join_injective_discord' && state === 'unchecked') || action === 'follow_injective' || action === 'follow_xninja' || action === 'like' || action === 'retweet' || action === 'tweet') {
                if ((action === 'join_injective_discord' && state === 'unchecked')) {
                    await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${questName}.${action}`]: 'unchecked' } });
                } else {
                    await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${questName}.${action}`]: true } });
                };

                res.status(200).end();
                return;
            };
        } else if (questName === 'dojo_launchpad') {
            if (action === 'follow_dojoswap' || action === 'follow_xninja' || action === 'like' || action === 'retweet' || action === 'tweet' || action === 'join_dojoswap_telegram') {
                await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${questName}.${action}`]: true } });

                res.status(200).end();
                return;
            };
        };

        res.status(404).end();
    });
};