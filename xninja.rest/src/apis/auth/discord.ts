import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import appConfig from '../../app.config';

export default function (router: Router) {
    router.post("/auth/discord", middleWare, async (req: RequestWithUser, res) => {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const { DISCORD_GUILD_ID } = req.body;

        if (typeof DISCORD_GUILD_ID !== 'string') {
            res.status(500).end();
            return;
        };

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        let QUEST_AND_ACTION = 'starter_pack.join_discord';

        if (DISCORD_GUILD_ID === (await appConfig()).data.quests.injective_quest_social_task.tasks.join_injective_discord.DISCORD_GUILD_ID) {
            QUEST_AND_ACTION = 'injective_quest_social_task.join_injective_discord';
        };

        await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { [`quests.${QUEST_AND_ACTION}`]: true } });

        res.status(200).end();
    });
};