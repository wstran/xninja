import Database from './libs/database';
import { CONFIG_BOOSTS, CONFIG_FOODS, CONFIG_CHESTS, MANA_CLASSES, LEVEL_NINJAS } from './libs/game.config';

export interface AppConfig {
    borrow_state: 'enable' | 'pause' | 'disable';
    convert_elem_to_xnj_state: 'enable' | 'pause' | 'disable';
    convert_xnj_to_elem_state: 'enable' | 'disable';
    borrow_percent: number;
    XNJ_price: number;
    allow_earn_claim: boolean;
    allow_referral_claim: boolean;
    max_convert_daily: number;
    min_user_convert: number;
    max_user_convert: number;
    data: { [key: string]: any };
};

const appConfig: AppConfig = { // default when db dies or miss data
    borrow_state: 'disable',
    convert_elem_to_xnj_state: 'disable',
    convert_xnj_to_elem_state: 'disable',
    borrow_percent: 85,
    XNJ_price: 0.05,
    allow_earn_claim: true,
    allow_referral_claim: true,
    max_convert_daily: 10000,
    min_user_convert: 75,
    max_user_convert: 150,
    data: {
        liquidated: false,
        quests: {
            dojo_launchpad: {
                title: '🤝 DojoSwap: $XNJ launchpad 🚀',
                description: 'Mark your calendar - 29th Feb, 8am GMT - $XNJ will launch on DojoSwap launchpad',
                quest_type: 'ONE_TIME',
                tasks: {
                    join_dojoswap_telegram: {
                        item_type: 'FOLLOW',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Join<a href='https://t.me/dojo_swap' target='_blank' class='text-blue-500 px-1'>DojoSwap </a>telegram
                            </span>
                        `,
                        questUrls: [
                            'https://t.me/dojo_swap'
                        ],
                    },
                    follow_dojoswap: {
                        item_type: 'FOLLOW',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Follow<a href='https://twitter.com/Dojo_Swap' target='_blank' class='text-blue-500 px-1'>DojoSwap</a>𝕏 account
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/Dojo_Swap'
                        ],
                    },
                    follow_xninja: {
                        item_type: 'FOLLOW',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Follow<a href='https://twitter.com/xninja_tech' target='_blank' class='text-blue-500 px-1'>xNinja</a>𝕏 account
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech'
                        ],
                    },
                    like: {
                        item_type: 'LIKE',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                            </svg>
                            <span>
                                Like the announcement post
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1761400025354240320'
                        ],
                    },
                    retweet: {
                        item_type: 'RETWEET',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                            </svg>
                            <span>
                                Retweet the announcement post
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1761400025354240320'
                        ],
                    },
                    tweet: {
                        item_type: 'TWEET',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="24" width="24" viewBox="0 0 576 512" fill="#000">
                                <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                            </svg>
                            <span>
                                Post about $XNJ, xNinja & DojoSwap on 𝕏, including #xNinja & #DojoSwap hashtags
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/intent/tweet?text=xNinja+%F0%9F%A4%9D+DojoSwap%3A+%24XNJ+launchpad+%F0%9F%9A%80%0A%0AA+special+Quest+with+exclusive+Chest+%26+%24ELEM+%F0%9F%8E%81%0A%0A1%EF%B8%8F%E2%83%A3+Go+to+app.xninja.tech%0A2%EF%B8%8F%E2%83%A3+Complete+%24XNJ+launchpad+%F0%9F%9A%80+Quest%0A%E2%9C%85+Claim+exclusive+rewards%0A%0A%23xNinja+%23DojoSwap+%24XNJ+%24DOJO',
                        ],
                    },
                }
            },
            starter_pack: {
                title: 'xNinja Free Starter Pack',
                description: 'Must-have luggage for all ‘newja’',
                quest_type: 'ONE_TIME',
                tasks: {
                    join_discord: {
                        item_html: `
                            <svg class="mr-1 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
                            </svg>
                            <span>
                                Join our
                                <a href='https://discord.gg/xninja' class="text-blue-500">
                                    discord.gg/xninja
                                </a>
                            </span>
                        `,
                        item_type: 'JOIN_DISCORD',
                        questUrls: [
                            'https://discord.gg/xninja',
                        ],
                        DISCORD_CLIENT_ID: '1197847087656751114',
                        DISCORD_GUILD_ID: '1194888148921102356',
                        DISCORD_REDIRECT_WEB_URI: process.env.CLIENT_WEB_URL + '/oauth/callback/discord',
                        DISCORD_REDIRECT_EXT_URI: process.env.CLIENT_URL + '/oauth/callback/discord',
                    },
                    follow: {
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Follow @xninja_tech on 𝕏
                            </span>
                        `,
                        item_type: 'FOLLOW',
                        questUrls: [
                            'https://twitter.com/intent/follow?region=follow_link&screen_name=xninja_tech'
                        ],
                    },
                    turn_on_notification: {
                        item_html: `
                            <svg class="mr-1" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M19.0001 9.7041V9C19.0001 5.13401 15.8661 2 12.0001 2C8.13407 2 5.00006 5.13401 5.00006 9V9.7041C5.00006 10.5491 4.74995 11.3752 4.28123 12.0783L3.13263 13.8012C2.08349 15.3749 2.88442 17.5139 4.70913 18.0116C9.48258 19.3134 14.5175 19.3134 19.291 18.0116C21.1157 17.5139 21.9166 15.3749 20.8675 13.8012L19.7189 12.0783C19.2502 11.3752 19.0001 10.5491 19.0001 9.7041Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path opacity="0.5" d="M12 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>
                                Turn on Notification for us on 𝕏
                            </span>
                        `,
                        item_type: 'TURN_ON_NOTIFICATION',
                        questUrls: [
                            'https://twitter.com/xninja_tech'
                        ],
                    },
                    like: {
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                            </svg>
                            <span>
                                Like our tweet on 𝕏
                            </span>
                        `,
                        item_type: 'LIKE',
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1760320595525546043'
                        ],
                    },
                    retweet: {
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                            </svg>
                            <span>
                                Retweet our tweet on 𝕏
                            </span>
                        `,
                        item_type: 'RETWEET',
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1760320595525546043'
                        ],
                    },
                }
            },
            dojo_drill: {
                title: 'Daily Dojo Drill',
                description: '>Keep perseverance to become Master Ninja',
                quest_type: 'DAILY',

            },
            hidden_leaf: {
                title: 'The Way of the Hidden Leaf',
                description: 'Claim chests every day for training Ninja faster',
                quest_type: 'EXT',
                max_count_on_day: 2,
            },
            injective_quest_social_task: {
                title: 'xNinja 🤝 Injective',
                description: 'Push Ninja spirit & ecosystem growth',
                quest_type: 'ONE_TIME',
                tasks: {
                    join_injective_discord: {
                        item_html: `
                            <svg class="mr-1 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
                            </svg>
                            <span>
                                Join
                                <a href='https://discord.gg/injective' class="text-blue-500">
                                    Injective 
                                </a> discord
                            </span>
                        `,
                        item_type: 'JOIN_DISCORD',
                        questUrls: [
                            'https://discord.gg/injective'
                        ],
                        DISCORD_CLIENT_ID: '1197847087656751114',
                        DISCORD_GUILD_ID: '739552603322450092',
                        DISCORD_REDIRECT_WEB_URI: process.env.CLIENT_WEB_URL + '/oauth/callback/discord',
                        DISCORD_REDIRECT_EXT_URI: process.env.CLIENT_URL + '/oauth/callback/discord',
                    },
                    follow_injective: {
                        item_type: 'FOLLOW',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Follow<a href='https://twitter.com/injective' target='_blank' class='text-blue-500 px-1'>Injective</a>𝕏 account
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/injective'
                        ],
                    },
                    follow_xninja: {
                        item_type: 'FOLLOW',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" class="mr-1">
                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                            </svg>
                            <span>
                                Follow<a href='https://twitter.com/xninja_tech' target='_blank' class='text-blue-500 px-1'>xNinja</a>𝕏 account
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech'
                        ],
                    },
                    like: {
                        item_type: 'LIKE',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                            </svg>
                            <span>
                                Like the announcement post
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1761400025354240320'
                        ],
                    },
                    retweet: {
                        item_type: 'RETWEET',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                            </svg>
                            <span>
                                Retweet the announcement post
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/xninja_tech/status/1761400025354240320'
                        ],
                    },
                    tweet: {
                        item_type: 'TWEET',
                        item_html: `
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1" height="24" width="24" viewBox="0 0 576 512" fill="#000">
                                <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                            </svg>
                            <span>
                                Post about Injective & xNinja on 𝕏, including #Injective & #xNinja hashtags
                            </span>
                        `,
                        questUrls: [
                            'https://twitter.com/intent/tweet?text=Congratulations+on+%23xNinja+launch+on+%23Injective+mainnet+%F0%9F%8E%89%0A%0ABig+things+are+coming+to+Ninjas+community+%F0%9F%A5%B7+%F0%9F%9A%80%0A%0A%24INJ+%24XNJ+%24ELEM+%40xninja_tech',
                            'https://twitter.com/intent/tweet?text=%23xNinja+%F0%9F%A4%9D+%23Injective+to+push+Ninja+spirit+%26+ecosystem+growth+%F0%9F%A5%B7+%F0%9F%9A%80%0A%0AProbably+something+%F0%9F%91%80%0A%0A%24INJ+%24XNJ+%24ELEM+%40xninja_tech',
                            'https://twitter.com/intent/tweet?text=%23xNinja+%26+%23Injective+accompany+each+other+to+boost+Ninja+spirit+%26+ecosystem+growth+%F0%9F%A5%B7+%F0%9F%9A%80%0A%0ABig+things+ahead+%F0%9F%91%80%0A%0A%24INJ+%24XNJ+%24ELEM+%40xninja_tech',
                            'https://twitter.com/intent/tweet?text=%23xNinja+-+the+first+SocialFi+2.0+built+on+%23Injective+is+now+live+on+mainnet+%E2%9C%85%0A%0ALet%E2%80%99s+train+your+Ninjas%2C+fight+battles+directly+on+%F0%9D%95%8F+interface+%26+earn+rewards+while+scrolling+%26+playing+now+%E2%9A%94%EF%B8%8F%F0%9F%A5%B7%0A%0A%40xninja_tech+%24INJ+%24XNJ+%24ELEM',
                            'https://twitter.com/intent/tweet?text=%23xNinja+is+built+on+top+of+%F0%9D%95%8F+%28Twitter%29+to+make+your+experience+on+%F0%9D%95%8F+more+enjoyable+with+a+virtual+Ninja+when+you+train+that+Ninja+and+fight+battles+with+others+%E2%9A%94%EF%B8%8F%0A%0A%F0%9F%A5%B7+Ninja+spirit%2C+smooth+%F0%9D%95%8F+experience+%26+extra+earnings+%F0%9F%8E%AF%0A%0APlay+now+at+%40xninja_tech+%0A%0A%24INJ+%24XNJ+%24ELEM',

                        ],
                    },
                }
            },
        },
    },
};

export default async function getAppConfig() {
    try {
        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const configCollection = db.collection('config');

        const resultAppConfig: AppConfig = await configCollection.findOne({ config_type: 'prod' }, { projection: { _id: 0 } }) as any;

        return { ...appConfig, ...resultAppConfig, data: { ...appConfig.data, ...resultAppConfig?.data, CONFIG_BOOSTS, CONFIG_FOODS, CONFIG_CHESTS, MANA_CLASSES, LEVEL_NINJAS } } as AppConfig;
    } catch {
        return { ...appConfig, data: { ...appConfig.data, CONFIG_BOOSTS, CONFIG_FOODS, CONFIG_CHESTS, MANA_CLASSES, LEVEL_NINJAS } };
    };
};