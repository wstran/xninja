import { Router } from 'express';
import { middleWare } from "../../config";
import type { RequestWithUser } from '../../config';
import Database from '../../libs/database';
import queueRequest from '../../libs/queue-request';
import getAppConfig from '../../app.config';
import { CONFIG_FOODS } from '../../libs/game.config';

const [StartRequest, EndRequest] = queueRequest();

function getRandomInteger(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default function (router: Router) {
    router.post("/quests/open", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { questName, action } = req.body;

            if (!questName || !action) {
                res.status(403).end();
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const userCollection = db.collection('users');

            const appConfig = await getAppConfig();

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, quests: 1 } });

            if (!dbUser) {
                res.status(403).end();
                return;
            };

            if (questName === 'starter_pack' && action === '_opened') {
                if (dbUser.quests.starter_pack._opened) {
                    res.status(200).end();
                    return;
                };

                if (
                    dbUser.quests.starter_pack.join_discord !== true ||
                    !dbUser.quests.starter_pack.follow ||
                    !dbUser.quests.starter_pack.turn_on_notification ||
                    !dbUser.quests.starter_pack.like ||
                    !dbUser.quests.starter_pack.retweet
                ) {
                    res.status(404).end();
                    return;
                };

                const ELEM = getRandomInteger(50, 70);

                const result = await userCollection.updateOne({
                    tw_id: req.payload.tw_id,
                    'quests.starter_pack': { $exists: true },
                    'quests.starter_pack._opened': { $ne: true },
                    'quests.starter_pack.join_discord': true,
                    'quests.starter_pack.follow': true,
                    'quests.starter_pack.turn_on_notification': true,
                    'quests.starter_pack.like': true,
                    'quests.starter_pack.retweet': true,
                }, {
                    $set: {
                        'quests.starter_pack._opened': true,
                        'quests.starter_pack._rewards': { tokens: { ELEM } },
                    },
                    $inc: { 'wallet.ELEM': ELEM },
                });

                if ((result.acknowledged === true && result.modifiedCount > 0)) {
                    res.status(200).json({ ELEM });
                } else {
                    res.status(200).end();
                };
                return;
            } else if (questName === 'dojo_drill') {
                const date = new Date();

                const claim_total_days = Math.floor((dbUser.quests?.dojo_drill?.claim_at?.getTime() || 0) / (24 * 60 * 60 * 1000));
                const now_total_days = Math.floor((date?.getTime() || 0) / (24 * 60 * 60 * 1000));
                const another = dbUser.quests?.dojo_drill?.claim_at?.getTime() && claim_total_days !== now_total_days && claim_total_days < now_total_days && claim_total_days !== now_total_days - 1;

                if (action === 'day_1') {
                    if (
                        (typeof dbUser.quests?.dojo_drill?.day !== 'number' && !dbUser.quests?.dojo_drill?.claim_at)
                        || (dbUser.quests?.dojo_drill?.day === 7 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1)
                        || (typeof dbUser.quests?.dojo_drill?.day === 'number' && dbUser.quests?.dojo_drill?.claim_at && another)) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $inc: { 'inventorys.rice': 1 }, $set: { 'quests.dojo_drill': { day: 1, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_2') {
                    if (dbUser.quests?.dojo_drill?.day === 1 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 1 }, { $inc: { 'inventorys.rice': 2 }, $set: { 'quests.dojo_drill': { day: 2, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_3') {
                    if (dbUser.quests?.dojo_drill?.day === 2 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 2 }, { $inc: { 'inventorys.miso_soup': 1 }, $set: { 'quests.dojo_drill': { day: 3, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_4') {
                    if (dbUser.quests?.dojo_drill?.day === 3 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 3 }, { $inc: { 'wallet.ELEM': 2 }, $set: { 'quests.dojo_drill': { day: 4, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_5') {
                    if (dbUser.quests?.dojo_drill?.day === 4 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 4 }, { $inc: { 'inventorys.miso_soup': 2 }, $set: { 'quests.dojo_drill': { day: 5, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_6') {
                    if (dbUser.quests.dojo_drill?.day === 5 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 5 }, { $inc: { 'inventorys.meat': 2 }, $set: { 'quests.dojo_drill': { day: 6, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                } else if (action === 'day_7') {
                    if (dbUser.quests?.dojo_drill?.day === 6 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1) {
                        const result = await userCollection.updateOne({ tw_id: req.payload.tw_id, 'quests.dojo_drill.day': 6 }, { $inc: { 'wallet.ELEM': 10 }, $set: { 'quests.dojo_drill': { day: 7, claim_at: date } } });

                        (result.acknowledged === true && result.modifiedCount > 0) && res.status(200).json({ claim_at: date });
                    };
                };
                return;
            } else if (questName === 'happy_chinese_new_year' && action === '_opened') {
                if (dbUser.quests.happy_chinese_new_year._opened) {
                    res.status(200).end();
                    return;
                };

                if (
                    !dbUser.quests.happy_chinese_new_year.tweet ||
                    !dbUser.quests.happy_chinese_new_year.retweet
                ) {
                    res.status(404).end();
                    return;
                };

                const ELEM = getRandomInteger(10, 30);

                const result = await userCollection.updateOne({
                    tw_id: req.payload.tw_id,
                    'quests.happy_chinese_new_year': { $exists: true },
                    'quests.happy_chinese_new_year._opened': { $ne: true },
                    'quests.happy_chinese_new_year.tweet': true,
                    'quests.happy_chinese_new_year.retweet': true,
                }, {
                    $set: {
                        'quests.happy_chinese_new_year._opened': true,
                        'quests.happy_chinese_new_year._rewards': { tokens: { ELEM } },
                    },
                    $inc: { 'wallet.ELEM': ELEM },
                });

                if ((result.acknowledged === true && result.modifiedCount > 0)) {
                    res.status(200).json({ ELEM });
                } else {
                    res.status(200).end();
                };
                return;
            } else if (questName === 'hidden_leaf' && action === '_opened') {
                const now = new Date();
                const startOfToday = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
                const claim_at = dbUser.quests?.hidden_leaf?.claim_at;

                if (!dbUser.quests?.hidden_leaf || claim_at !== startOfToday || dbUser.quests?.hidden_leaf?.count < appConfig.data.quests.hidden_leaf.max_count_on_day) {
                    const userOffchainActionCollection = db.collection('user_offchain_actions');
                    const rewards = [{ type: 'food', name: 'rice', amount: 3 }, { type: 'food', name: 'miso_soup', amount: 2 }, { type: 'food', name: 'meat', amount: 1 }, { type: 'token', name: 'ELEM', amount: 1 }];
                    const item = rewards[getRandomInteger(0, rewards.length - 1)];

                    const result = await userCollection.bulkWrite([
                        {
                            updateOne: {
                                filter: {
                                    tw_id: req.payload.tw_id,
                                    $or: [
                                        { 'quests.hidden_leaf': { $exists: false } },
                                        { 'quests.hidden_leaf.claimed_at': { $exists: false } },
                                        { 'quests.hidden_leaf.claimed_at': { $ne: startOfToday } },
                                        { 'quests.hidden_leaf.count': { $exists: false } },
                                        { 'quests.hidden_leaf.count': { $lt: appConfig.data.quests.hidden_leaf.max_count_on_day } },
                                    ],
                                },
                                update: {
                                    $set: {
                                        'quests.hidden_leaf.claim_at': startOfToday,
                                    },
                                    $inc: { 'quests.hidden_leaf.count': 1 },
                                },
                            }
                        },
                        {
                            updateOne: {
                                filter: {
                                    tw_id: req.payload.tw_id,
                                    'quests.hidden_leaf.count': { $gt: appConfig.data.quests.hidden_leaf.max_count_on_day }
                                },
                                update: {
                                    $set: { 'quests.hidden_leaf.count': 1 },
                                },
                            }
                        }
                    ]);

                    if (result.matchedCount > 0 && result.modifiedCount > 0) {
                        if (item.type === 'food') {
                            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $inc: { [`inventorys.${item.name}`]: item.amount } });
                        } else {
                            await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $inc: { 'wallet.ELEM': item.amount } });
                        };

                        await userOffchainActionCollection.insertOne({ tw_id: req.payload.tw_id, action: 'quest_open_hidden_leaf', data: { item, claim_at: startOfToday } });

                        res.status(200).json({
                            item_name: item.type === 'food' ? CONFIG_FOODS[item.name].name : 'ELEM',
                            item_image: item.type === 'food' ? CONFIG_FOODS[item.name].image : 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png',
                            item_amount: item.amount,
                        });
                    } else {
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    };
                } else {
                    res.status(404).json({ status: 'CLAIMED' });
                };
                return;
            } else if (questName === 'injective_quest_social_task' && action === '_opened') {
                if (dbUser.quests.injective_quest_social_task._opened) {
                    res.status(200).end();
                    return;
                };

                if (
                    !dbUser.quests.injective_quest_social_task.follow_injective ||
                    !dbUser.quests.injective_quest_social_task.follow_xninja ||
                    !dbUser.quests.injective_quest_social_task.tweet ||
                    dbUser.quests.injective_quest_social_task.join_injective_discord !== true
                ) {
                    res.status(404).end();
                    return;
                };

                const ELEM = 10;

                const result = await userCollection.updateOne({
                    tw_id: req.payload.tw_id,
                    'quests.injective_quest_social_task': { $exists: true },
                    'quests.injective_quest_social_task._opened': { $ne: true },
                    'quests.injective_quest_social_task.follow_injective': true,
                    'quests.injective_quest_social_task.follow_xninja': true,
                    'quests.injective_quest_social_task.tweet': true,
                    'quests.injective_quest_social_task.join_injective_discord': true,
                }, {
                    $set: {
                        'quests.injective_quest_social_task._opened': true,
                        'quests.injective_quest_social_task._rewards': { tokens: { ELEM } },
                    },
                    $inc: { 'wallet.ELEM': ELEM },
                });

                if ((result.acknowledged === true && result.modifiedCount > 0)) {
                    res.status(200).json({ ELEM });
                } else {
                    res.status(200).end();
                };
                return;
            } else if (questName === 'dojo_launchpad' && action === '_opened') {
                if (dbUser.quests.dojo_launchpad._opened) {
                    res.status(200).end();
                    return;
                };

                if (
                    !dbUser.quests.dojo_launchpad.follow_dojoswap ||
                    !dbUser.quests.dojo_launchpad.follow_xninja ||
                    !dbUser.quests.dojo_launchpad.tweet ||
                    !dbUser.quests.dojo_launchpad.like ||
                    !dbUser.quests.dojo_launchpad.retweet ||
                    !dbUser.quests.dojo_launchpad.join_dojoswap_telegram
                ) {
                    res.status(404).end();
                    return;
                };

                const ELEM = 10;

                const result = await userCollection.updateOne({
                    tw_id: req.payload.tw_id,
                    'quests.dojo_launchpad': { $exists: true },
                    'quests.dojo_launchpad._opened': { $ne: true },
                    'quests.dojo_launchpad.join_dojoswap_telegram': true,
                    'quests.dojo_launchpad.follow_dojoswap': true,
                    'quests.dojo_launchpad.follow_xninja': true,
                    'quests.dojo_launchpad.tweet': true,
                    'quests.dojo_launchpad.like': true,
                    'quests.dojo_launchpad.retweet': true,
                }, {
                    $set: {
                        'quests.dojo_launchpad._opened': true,
                        'quests.dojo_launchpad._rewards': { tokens: { ELEM } },
                    },
                    $inc: { 'wallet.ELEM': ELEM },
                });

                if ((result.acknowledged === true && result.modifiedCount > 0)) {
                    res.status(200).json({ ELEM });
                } else {
                    res.status(200).end();
                };
                return;
            };
            res.status(404).end();
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};