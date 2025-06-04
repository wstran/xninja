import { middleWare } from "../config";
import type { RequestWithUser } from '../config';
import Database from '../libs/database';
import express, { NextFunction } from "express";

const router = express.Router();

import GameClaim from './games/claim';
import GameFarm from './games/farm';
import GameFeed from './games/feed';
import GameUpgrade from './games/upgrade';
import QuestGet from './quests/get';
import QuestOpen from './quests/open';
import QuestSet from './quests/set';
import MarketChest from './markets/buy_chest';
import MarketFood from './markets/buy_food';
import ProfileReferralsHistory from './profiles/referrals_history';
import ProfileReferralsClaim from './profiles/referrals_claim';
import ProfileExportWallet from './profiles/export-wallet';
import AuthDiscord from './auth/discord';
import Auth2FASetup from './auth/two-factor/setup';
import Auth2FADisable from './auth/two-factor/disable';
import Auth2FAEnable from './auth/two-factor/enable';
import Auth2FAVerify from './auth/two-factor/verify';
import BlockchainBorrow from './blockchain/borrow';
import BlockchainConvert from './blockchain/convert';
import BlockchainFetchBalance from './blockchain/fetch-balance';
import BlockchainRepay from './blockchain/repay';
import BlockchainWithdraw from './blockchain/withdraw';
import { CONFIG_CHESTS, CONFIG_MANA_CLASSES, MANA_CLASSES } from "../libs/game.config";
import queueRequest from "../libs/queue-request";

GameClaim(router);
GameFarm(router);
GameFeed(router);
GameUpgrade(router);
QuestGet(router);
QuestOpen(router);
QuestSet(router);
AuthDiscord(router);
MarketChest(router);
MarketFood(router);
ProfileReferralsHistory(router);
ProfileReferralsClaim(router);
ProfileExportWallet(router);
Auth2FASetup(router);
Auth2FADisable(router);
Auth2FAEnable(router);
Auth2FAVerify(router);
BlockchainBorrow(router);
BlockchainConvert(router);
BlockchainFetchBalance(router);
BlockchainRepay(router);
BlockchainWithdraw(router);

router.get("/ninjas", middleWare, async (req: RequestWithUser, res) => {
    if (!req.payload) {
        res.sendStatus(403);
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const ninjaCollection = db.collection('ninjas');

    const ninjas = await ninjaCollection.find({ ownerId: req.payload.tw_id }).project({ ownerId: 0 }).toArray();

    if (!ninjas) throw new Error("Not Authenticated");

    res.json(ninjas);
});

const [StartRequest, EndRequest] = queueRequest();

router.post("/import_referral_code", middleWare, StartRequest, async (req: RequestWithUser, res, next: NextFunction) => {
    try {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const { referral_code } = req.body;

        if (!referral_code || !referral_code.startsWith('xninja_')) {
            res.status(404).end();
            return;
        }

        if (referral_code === 'xninja_invite') {
            res.status(500).end();
            return;
        }

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const countUser = await userCollection.countDocuments({ tw_id: { $ne: req.payload.tw_id }, invite_code: referral_code });

        if (countUser === 1) {
            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $set: { referral_code } });
            await userCollection.updateOne({ invite_code: referral_code }, { $push: { user_refs: { tw_id: req.payload.tw_id, referral_date: new Date() } } });
            res.status(200).end();
        } else {
            res.status(404).end();
        };
    } catch (error) {
        throw error;
    } finally {
        next();
    };
}, EndRequest);

function getRandomClass(classes: MANA_CLASSES[]): MANA_CLASSES {
    const randomIndex = Math.floor(Math.random() * classes.length);
    return classes[randomIndex];
};

router.post("/claim_first_chest", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
    try {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');
        const ninjaCollection = db.collection('ninjas');
        const offChainLogCollection = db.collection('offchain_logs');

        const dbCount = await ninjaCollection.countDocuments({ ownerId: req.payload.tw_id });

        if (dbCount === 0) {
            const { level, classes, price } = CONFIG_CHESTS.chest_lv_0;

            const chest_class = getRandomClass(classes);

            const mana = new Date();

            mana.setHours(mana.getHours() + (8 * CONFIG_MANA_CLASSES[chest_class]));

            const chestData = { ownerId: req.payload.tw_id, class: chest_class, level, mana, created_at: new Date() };

            const ninjaInsert = await ninjaCollection.insertOne(chestData);

            if (ninjaInsert.acknowledged === true) {
                await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $push: { ninjas: { id: ninjaInsert.insertedId.toHexString(), created_at: chestData.created_at } } });

                await offChainLogCollection.insertOne({ action: 'claim_first_chest', tw_id: req.payload.tw_id, price, ...chestData, chestId: ninjaInsert.insertedId });

                res.status(200).json({ class: chest_class, mana: chestData.mana });
                return;
            };
        };

        res.status(404).end();
    } catch (error) {
        throw error;
    } finally {
        next();
    };
}, EndRequest);

export default router;
