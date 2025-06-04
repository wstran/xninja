import { getSession, signOut, useSession } from 'next-auth/react';
import { Login } from './login';
import Database from '@/libs/database';
import { JWT } from 'next-auth/jwt';
import { GetServerSidePropsContext } from 'next';
import InvitePage from '@/components/input_invite';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '@/store/themeConfigSlice';
import React, { Fragment, useEffect, useState } from 'react';
import { Tab } from '@headlessui/react';
import axios from 'axios';
import MyBag from '@/components/my_bag';
import { useRouter } from 'next/router';
import { formatPriceNumber } from '@/libs/custom';
import * as crypto from 'crypto';
import { CONFIG_FOODS } from '@/libs/game.config';

interface Seesion {
    data: {
        user?: {
            tw_id: string;
            name: string;
            username: string;
            profile_image_url: string;
            addresses: { injectiveAddress: string; ethereumAddress: string };
            two_factor_enabled: boolean;
            wallet: { ELEM: number };
            discordId: string;
            boosts: { count?: number; date: Date };
        };
        expries: string;
    };
    status: 'authenticated' | 'loading' | 'unauthenticated';
}

const createSignature = (url: string, params: any, secretKey: string) => {
    const timestamp = new Date().getTime();

    let data = `timestamp=${timestamp}&url=${url}`;

    Object.keys(params).forEach((key) => {
        data += `&${key}=${params[key]}`;
    });

    const signature = crypto.createHmac('sha256', secretKey).update(data).digest('hex');

    return { timestamp, signature };
};

const questMenus: {
    [key: string]: ({ backToQuest, quests, setQuests }: { backToQuest: () => void; quests: any; setQuests: React.Dispatch<any>; setWallet: React.Dispatch<any> }) => React.JSX.Element;
} = {
    starter_pack: ({ backToQuest, quests, setQuests, setWallet }) => {
        //@ts-ignore
        const { data: session, status }: Seesion = useSession();

        useEffect(() => {
            const getQuests = sessionStorage.getItem('quests');
            let quests = { starter_pack: {} };

            try {
                if (getQuests) {
                    quests = JSON.parse(getQuests);
                }
            } catch { }

            setQuests(quests);
        }, []);

        const [activeQuests, setActiveQuests] = useState({ follow: false, turn_on_notification: false, like: false, retweet: false });

        if (status === 'loading') return <></>;

        return (
            quests && (
                <div className="ml-1 flex flex-col">
                    <div className="mb-5 flex">
                        <svg onClick={backToQuest} className="cursor-pointer mt-[5px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-xl font-bold text-black`}>xNinja Free Starter Pack</span>
                    </div>
                    <div className={`panel rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg className="mr-1 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
                                </svg>
                                <span>
                                    Join our{' '}
                                    <a href="https://discord.gg/xninja" className="text-[#3e96f1]">
                                        discord.gg/xninja
                                    </a>
                                </span>
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.starter_pack.join_discord === true}
                                    onClick={() => {
                                        if (!quests.starter_pack.join_discord) {
                                            const action = 'join_discord';
                                            const state = 'unchecked';
                                            const questName = 'starter_pack';
                                            const apiPath = '/api/quests/set';
                                            const questUrl = 'https://discord.gg/xninja';

                                            window.open(questUrl);

                                            const user = session?.user;
                                            const params = { questName, questUrl, action };

                                            const secret = crypto
                                                .createHash('sha256')
                                                .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                                .digest('hex');

                                            const { timestamp, signature } = createSignature(apiPath, params, secret);

                                            axios
                                                .post(apiPath, { questName, action, state, timestamp, queryId: signature })
                                                .then(() => {
                                                    setTimeout(() => {
                                                        const getQuests = sessionStorage.getItem('quests');
                                                        let quests = { starter_pack: {} };

                                                        try {
                                                            if (getQuests) {
                                                                quests = JSON.parse(getQuests);
                                                            }
                                                        } catch { }

                                                        const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: 'unchecked' } };

                                                        setQuests(newQuests);

                                                        sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                    }, 1000);
                                                })
                                                .catch((error) => {
                                                    error.response.status === 403 && signOut({ callbackUrl: '/' });
                                                });
                                        } else if (quests.starter_pack.join_discord === 'unchecked') {
                                            const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
                                                process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
                                            )}&response_type=code&scope=guilds.join+identify+guilds`;
                                            window.location.href = discordLoginUrl;
                                        }
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {quests.starter_pack.join_discord === true && (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                    {quests.starter_pack.join_discord === 'unchecked' && 'Check'}
                                    {!quests.starter_pack.join_discord && 'Go'}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" className="mr-1">
                                    <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                </svg>
                                Follow @xninja_tech on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.starter_pack.follow || activeQuests.follow === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, follow: true }));
                                        const action = 'follow';
                                        const questName = 'starter_pack';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/follow?region=follow_link&screen_name=xninja_tech';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, follow: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { starter_pack: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.follow === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.starter_pack.follow ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg className="mr-1" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M19.0001 9.7041V9C19.0001 5.13401 15.8661 2 12.0001 2C8.13407 2 5.00006 5.13401 5.00006 9V9.7041C5.00006 10.5491 4.74995 11.3752 4.28123 12.0783L3.13263 13.8012C2.08349 15.3749 2.88442 17.5139 4.70913 18.0116C9.48258 19.3134 14.5175 19.3134 19.291 18.0116C21.1157 17.5139 21.9166 15.3749 20.8675 13.8012L19.7189 12.0783C19.2502 11.3752 19.0001 10.5491 19.0001 9.7041Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path opacity="0.5" d="M12 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Turn on Notification for us on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.starter_pack.turn_on_notification || activeQuests.turn_on_notification === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, turn_on_notification: true }));
                                        const action = 'turn_on_notification';
                                        const questName = 'starter_pack';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/xninja_tech';

                                        window.open(questUrl);

                                        const user = session?.user;
                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, turn_on_notification: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { starter_pack: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.turn_on_notification === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.starter_pack.turn_on_notification ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                    <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                                </svg>
                                Like our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.starter_pack.like || activeQuests.like === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, like: true }));
                                        const action = 'like';
                                        const questName = 'starter_pack';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/like?tweet_id=1750166319087910912';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, like: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { starter_pack: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.like === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.starter_pack.like ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                    <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                                </svg>
                                Retweet our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.starter_pack.retweet || activeQuests.retweet === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, retweet: true }));
                                        const action = 'retweet';
                                        const questName = 'starter_pack';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/retweet?tweet_id=1750166319087910912';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, retweet: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { starter_pack: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.retweet === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.starter_pack.retweet ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`panel mt-5 rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <span className="mb-2 flex">Reward {quests.starter_pack._opened && <img src="/assets/images/opened_chest.png" width={25} height={25} alt="" />}</span>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex flex-col">
                            {!quests.starter_pack._opened && <span className="flex w-full justify-center">Newbie Chest</span>}
                            {!quests.starter_pack._opened && (
                                <div className="flex w-full justify-center">
                                    <img src="/assets/images/transparent_treasure_chest.png" width={100} height={100} alt="" />
                                </div>
                            )}
                            {quests.starter_pack._opened && (
                                <div className="flex w-full justify-center">
                                    <div className="mr-1 ml-1 flex">
                                        <span className="mt-3 mr-[1px] text-base">+{quests.starter_pack._rewards.tokens.ELEM}</span>
                                        <img src={`/assets/images/ELEM.png`} width={50} height={50} alt="" />
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 flex w-full justify-center">
                                <button
                                    onClick={() => {
                                        const action = '_opened';
                                        const questName = 'starter_pack';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { ELEM } = response.data;

                                                setWallet((prev: any) => ({ ...prev, ELEM: prev.ELEM + ELEM }));
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { starter_pack: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, starter_pack: { ...quests.starter_pack, [action]: true, _rewards: { tokens: { ELEM } } } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    disabled={
                                        quests.starter_pack.join_discord !== true ||
                                        !quests.starter_pack.follow ||
                                        !quests.starter_pack.turn_on_notification ||
                                        !quests.starter_pack.like ||
                                        !quests.starter_pack.retweet ||
                                        quests.starter_pack._opened
                                    }
                                    type="button"
                                    className="justify-center btn btn-outline-white w-[300px] h-[20px] rounded-full hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]"
                                >
                                    {quests.starter_pack._opened ? 'Opened' : 'Open'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        );
    },
    hidden_leaf: ({ backToQuest }) => {
        return (
            <div className="ml-1 flex flex-col">
                <div className="mb-5 flex">
                    <svg onClick={backToQuest} className="cursor-pointer mt-[5px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>The Way of the Hidden Leaf</span>
                </div>
            </div>
        );
    },
    dojo_drill: ({ backToQuest, quests, setQuests, setWallet }) => {
        const day = quests.dojo_drill.day;
        const claim_at = quests.dojo_drill.claim_at && new Date(quests.dojo_drill.claim_at);

        const date = new Date();

        const claim_total_days = Math.floor((claim_at?.getTime() || 0) / (24 * 60 * 60 * 1000));
        const now_total_days = Math.floor((date.getTime() || 0) / (24 * 60 * 60 * 1000));
        const another = claim_at?.getTime() && claim_total_days !== now_total_days && claim_total_days < now_total_days && claim_total_days !== now_total_days - 1;
        const day_1 = (typeof day !== 'number' && !claim_at) || (day === 7 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1);
        const day_2 = day === 1 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;
        const day_3 = day === 2 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;
        const day_4 = day === 3 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;
        const day_5 = day === 4 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;
        const day_6 = day === 5 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;
        const day_7 = day === 6 && claim_total_days !== now_total_days && claim_total_days === now_total_days - 1;

        return (
            <div className="ml-1 flex flex-col">
                <div className="mb-5 flex">
                    <svg onClick={backToQuest} className="cursor-pointer mt-[5px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Daily Dojo Drill</span>
                </div>
                <div className="flex flex-wrap mt-5 justify-center max-w-[375px] overflow-y-auto scrollbar-hide">
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 1</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={CONFIG_FOODS.rice.image} />
                            <span className="text-xs font-pixel">1x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_1 && !another}
                                    onClick={() => {
                                        const action = 'day_1';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 1, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {typeof quests.dojo_drill.day !== 'number' || day === 7 || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 2</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={CONFIG_FOODS.rice.image} />
                            <span className="text-xs font-pixel">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_2 || another}
                                    onClick={() => {
                                        const action = 'day_2';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 2, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 1 || !day_2) && (typeof day !== 'number' || day < 2)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 3</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={CONFIG_FOODS.miso_soup.image} />
                            <span className="text-xs font-pixel">1x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_3 || another}
                                    onClick={() => {
                                        const action = 'day_3';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 3, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 2 || !day_3) && (typeof day !== 'number' || day < 3)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 4</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={`/assets/images/ELEM.png`} />
                            <span className="text-xs font-pixel">2 ELEM</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_4 || another}
                                    onClick={() => {
                                        const action = 'day_4';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;

                                                setWallet((prev: any) => ({ ...prev, ELEM: prev.ELEM + 2 }));
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 4, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 3 || !day_4) && (typeof day !== 'number' || day < 4)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 5</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={CONFIG_FOODS.miso_soup.image} />
                            <span className="text-xs font-pixel">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_5 || another}
                                    onClick={() => {
                                        const action = 'day_5';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;

                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 5, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 4 || !day_5) && (typeof day !== 'number' || day < 5)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 6</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={CONFIG_FOODS.meat.image} />
                            <span className="text-xs font-pixel">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_6 || another}
                                    onClick={() => {
                                        const action = 'day_6';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;

                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 6, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 5 || !day_6) && (typeof day !== 'number' || day < 6)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[120px] h-auto bg-[#f5f5f4] rounded-md" onClick={() => { }}>
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">Day 7</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={`/assets/images/ELEM.png`} />
                            <span className="text-xs font-pixel">10 ELEM</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_7 || another}
                                    onClick={() => {
                                        const action = 'day_7';
                                        const questName = 'dojo_drill';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { claim_at } = response.data;

                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { dojo_drill: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, dojo_drill: { ...quests.dojo_drill, day: 7, claim_at: new Date(claim_at) } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                >
                                    {((quests.dojo_drill.day === 6 || !day_7) && (typeof day !== 'number' || day < 7)) || another ? (
                                        'Claim'
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    exclusive_quest: ({ backToQuest, quests, setQuests, setWallet }) => {
        //@ts-ignore
        const { data: session, status }: Seesion = useSession();

        useEffect(() => {
            const getQuests = sessionStorage.getItem('quests');
            let quests = { exclusive_quest: {} };

            try {
                if (getQuests) {
                    quests = JSON.parse(getQuests);
                }
            } catch { }

            setQuests(quests);
        }, []);

        const [activeQuests, setActiveQuests] = useState({ follow_injective: false, follow_dojoswap: false, like: false, retweet: false });

        if (status === 'loading') return <></>;

        return (
            quests && (
                <div className="ml-1 flex flex-col">
                    <div className="mb-5 flex">
                        <svg onClick={backToQuest} className="cursor-pointer mt-[5px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-base font-bold text-black`}>xNinja x Injective x Dojo Exclusive Quest</span>
                    </div>
                    <div className={`panel rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" className="mr-1">
                                    <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                </svg>
                                Follow @Injective_ on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.exclusive_quest.follow_injective || activeQuests.follow_injective === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, follow_injective: true }));
                                        const action = 'follow_injective';
                                        const questName = 'exclusive_quest';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/follow?region=follow_link&screen_name=Injective_';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, follow_injective: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { exclusive_quest: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, exclusive_quest: { ...quests.exclusive_quest, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.follow_injective === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.exclusive_quest.follow_injective ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" className="mr-1">
                                    <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                </svg>
                                Follow @Dojo_Swap on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.exclusive_quest.follow_dojoswap || activeQuests.follow_dojoswap === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, follow_dojoswap: true }));
                                        const action = 'follow_dojoswap';
                                        const questName = 'exclusive_quest';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/follow?region=follow_link&screen_name=Dojo_Swap';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, follow_dojoswap: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { exclusive_quest: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, exclusive_quest: { ...quests.exclusive_quest, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.follow_dojoswap === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.exclusive_quest.follow_dojoswap ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                    <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                                </svg>
                                Like our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.exclusive_quest.like || activeQuests.like === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, like: true }));
                                        const action = 'like';
                                        const questName = 'exclusive_quest';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/like?tweet_id=1753011397389385995';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, like: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { exclusive_quest: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, exclusive_quest: { ...quests.exclusive_quest, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.like === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.exclusive_quest.like ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                    <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                                </svg>
                                Retweet our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.exclusive_quest.retweet || activeQuests.retweet === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, retweet: true }));
                                        const action = 'retweet';
                                        const questName = 'exclusive_quest';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/retweet?tweet_id=1753011397389385995';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, retweet: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { exclusive_quest: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, exclusive_quest: { ...quests.exclusive_quest, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.retweet === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.exclusive_quest.retweet ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`panel mt-5 rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <span className="mb-2 flex">Reward {quests.exclusive_quest._opened && <img src="/assets/images/opened_chest.png" width={25} height={25} alt="" />}</span>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex flex-col">
                            {!quests.exclusive_quest._opened && <span className="flex w-full justify-center">Exclusive quest chest</span>}
                            {!quests.exclusive_quest._opened && (
                                <div className="flex w-full justify-center">
                                    <img src="/assets/images/transparent_treasure_chest.png" width={100} height={100} alt="" />
                                </div>
                            )}
                            {quests.exclusive_quest._opened && (
                                <div className="flex w-full justify-center">
                                    <div className="mr-1 ml-1 flex items-center">
                                        <span className="mt-1 mr-[1px] text-base font-pixel">+{quests.exclusive_quest._rewards.tokens.ELEM}</span>
                                        <img src={`/assets/images/ELEM.png`} width={35} height={30} alt="" />
                                    </div>
                                    <div className="mr-1 ml-1 flex items-center">
                                        <span className="mt-1 mr-[1px] text-base font-pixel">+{quests.exclusive_quest._rewards.foods.rice}</span>
                                        <img src={`/assets/images/foods/rice.svg`} className='mb-1' width={30} height={30} alt="" />
                                    </div>
                                    <div className="mr-1 ml-1 flex items-center">
                                        <span className="mt-1 mr-[1px] text-base font-pixel">+{quests.exclusive_quest._rewards.foods.miso_soup}</span>
                                        <img src={`/assets/images/foods/miso_soup.svg`} className='mt-2' width={40} height={40} alt="" />
                                    </div>
                                    <div className="mr-1 ml-1 flex items-center">
                                        <span className="mt-1 mr-[1px] text-base font-pixel">+{quests.exclusive_quest._rewards.foods.meat}</span>
                                        <img src={`/assets/images/foods/meat.svg`} className='mb-2' width={40} height={40} alt="" />
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 flex w-full justify-center">
                                <button
                                    onClick={() => {
                                        const action = '_opened';
                                        const questName = 'exclusive_quest';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                setWallet((prev: any) => ({ ...prev, ELEM: prev.ELEM + 30 }));
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { exclusive_quest: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, exclusive_quest: { ...quests.exclusive_quest, [action]: true, _rewards: { tokens: { ELEM: 30 }, foods: { rice: 3, miso_soup: 2, meat: 1 } } } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    disabled={
                                        !quests.exclusive_quest.follow_injective ||
                                        !quests.exclusive_quest.follow_dojoswap ||
                                        !quests.exclusive_quest.like ||
                                        !quests.exclusive_quest.retweet ||
                                        quests.exclusive_quest._opened
                                    }
                                    type="button"
                                    className="justify-center btn btn-outline-white w-[300px] h-[20px] rounded-full hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]"
                                >
                                    {quests.exclusive_quest._opened ? 'Opened' : 'Open'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        );
    },
    happy_lunar_new_year: ({ backToQuest, quests, setQuests, setWallet }) => {
        //@ts-ignore
        const { data: session, status }: Seesion = useSession();

        useEffect(() => {
            const getQuests = sessionStorage.getItem('quests');
            let quests = { exclusive_quest: {} };

            try {
                if (getQuests) {
                    quests = JSON.parse(getQuests);
                }
            } catch { }

            setQuests(quests);
        }, []);

        const [activeQuests, setActiveQuests] = useState({ tweet: false, like: false, retweet: false });

        if (status === 'loading') return <></>;

        return (
            quests && (
                <div className="ml-1 flex flex-col">
                    <div className="mb-5 flex">
                        <svg onClick={backToQuest} className="cursor-pointer mt-[5px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-base font-bold text-black`}>Happy Lunar New Year to all Ninjas 🥷</span>
                    </div>
                    <div className={`panel rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 512 512" fill="#000" className="mr-1">
                                    <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                </svg>
                                Tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.happy_lunar_new_year.tweet || activeQuests.tweet === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, tweet: true }));
                                        const action = 'tweet';
                                        const questName = 'happy_lunar_new_year';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/tweet?text=Celebrating+the+Lunar+New+Year+with+%23xNinja+and+%23Injective%21+%F0%9F%A5%B7+%0A%0AWishing+all+Ninjas+prosperity+and+excitement+in+the+Year+of+the+Dragon+%F0%9F%90%89';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, tweet: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { happy_lunar_new_year: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, happy_lunar_new_year: { ...quests.happy_lunar_new_year, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.tweet === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.happy_lunar_new_year.tweet ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full mb-5 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="18" width="18" viewBox="0 0 512 512" fill="#000">
                                    <path d="M323.8 34.8c-38.2-10.9-78.1 11.2-89 49.4l-5.7 20c-3.7 13-10.4 25-19.5 35l-51.3 56.4c-8.9 9.8-8.2 25 1.6 33.9s25 8.2 33.9-1.6l51.3-56.4c14.1-15.5 24.4-34 30.1-54.1l5.7-20c3.6-12.7 16.9-20.1 29.7-16.5s20.1 16.9 16.5 29.7l-5.7 20c-5.7 19.9-14.7 38.7-26.6 55.5c-5.2 7.3-5.8 16.9-1.7 24.9s12.3 13 21.3 13L448 224c8.8 0 16 7.2 16 16c0 6.8-4.3 12.7-10.4 15c-7.4 2.8-13 9-14.9 16.7s.1 15.8 5.3 21.7c2.5 2.8 4 6.5 4 10.6c0 7.8-5.6 14.3-13 15.7c-8.2 1.6-15.1 7.3-18 15.2s-1.6 16.7 3.6 23.3c2.1 2.7 3.4 6.1 3.4 9.9c0 6.7-4.2 12.6-10.2 14.9c-11.5 4.5-17.7 16.9-14.4 28.8c.4 1.3 .6 2.8 .6 4.3c0 8.8-7.2 16-16 16H286.5c-12.6 0-25-3.7-35.5-10.7l-61.7-41.1c-11-7.4-25.9-4.4-33.3 6.7s-4.4 25.9 6.7 33.3l61.7 41.1c18.4 12.3 40 18.8 62.1 18.8H384c34.7 0 62.9-27.6 64-62c14.6-11.7 24-29.7 24-50c0-4.5-.5-8.8-1.3-13c15.4-11.7 25.3-30.2 25.3-51c0-6.5-1-12.8-2.8-18.7C504.8 273.7 512 257.7 512 240c0-35.3-28.6-64-64-64l-92.3 0c4.7-10.4 8.7-21.2 11.8-32.2l5.7-20c10.9-38.2-11.2-78.1-49.4-89zM32 192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32H96c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H32z" />
                                </svg>
                                Like our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.happy_lunar_new_year.like || activeQuests.like === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, like: true }));
                                        const action = 'like';
                                        const questName = 'happy_lunar_new_year';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/like?tweet_id=1756194800012083400';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, like: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { happy_lunar_new_year: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, happy_lunar_new_year: { ...quests.happy_lunar_new_year, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.like === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.happy_lunar_new_year.like ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex w-full">
                            <div className="flex w-full text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" height="16" width="18" viewBox="0 0 576 512" fill="#000">
                                    <path d="M272 416c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32-14.3-32-32V192h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l32 0 0 128c0 53 43 96 96 96H272zM304 96c-17.7 0-32 14.3-32 32s14.3 32 32 32l112 0c17.7 0 32 14.3 32 32l0 128H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8l-32 0V192c0-53-43-96-96-96L304 96z" />
                                </svg>
                                Retweet our tweet on 𝕏
                            </div>
                            <div className="flex justify-end right">
                                <button
                                    disabled={quests.happy_lunar_new_year.retweet || activeQuests.retweet === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, retweet: true }));
                                        const action = 'retweet';
                                        const questName = 'happy_lunar_new_year';
                                        const apiPath = '/api/quests/set';
                                        const questUrl = 'https://twitter.com/intent/retweet?tweet_id=1756194800012083400';

                                        window.open(questUrl);

                                        const user = session?.user;

                                        const params = { questName, questUrl, action };

                                        const secret = crypto
                                            .createHash('sha256')
                                            .update(String(apiPath + questUrl + user?.tw_id + user?.addresses.injectiveAddress))
                                            .digest('hex');

                                        const { timestamp, signature } = createSignature(apiPath, params, secret);

                                        axios
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, retweet: false }));
                                                    const getQuests = sessionStorage.getItem('quests');
                                                    let quests = { happy_lunar_new_year: {} };

                                                    try {
                                                        if (getQuests) {
                                                            quests = JSON.parse(getQuests);
                                                        }
                                                    } catch { }

                                                    const newQuests = { ...quests, happy_lunar_new_year: { ...quests.happy_lunar_new_year, [action]: true } };

                                                    setQuests(newQuests);

                                                    sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests.retweet === true ? (
                                        <svg
                                            stroke="currentColor"
                                            fill="currentColor"
                                            strokeWidth="0"
                                            version="1.1"
                                            viewBox="0 0 16 16"
                                            className="animate-spin mr-1"
                                            height="1em"
                                            width="1em"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                                        </svg>
                                    ) : quests.happy_lunar_new_year.retweet ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`panel mt-5 rounded-lg !text-black w-full max-w-[375px] !bg-[#f5f5f5] flex flex-col`}>
                        <span className="mb-2 flex">Reward {quests.happy_lunar_new_year._opened && <img src="/assets/images/opened_chest.png" width={25} height={25} alt="" />}</span>
                        <span className="overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5"></span>
                        <div className="flex flex-col">
                            {!quests.happy_lunar_new_year._opened && <span className="flex w-full justify-center">Happy Lunar New Year Chest</span>}
                            {!quests.happy_lunar_new_year._opened && (
                                <div className="flex w-full justify-center">
                                    <img src="/assets/images/transparent_treasure_chest.png" width={100} height={100} alt="" />
                                </div>
                            )}
                            {quests.happy_lunar_new_year._opened && (
                                <div className="flex w-full justify-center">
                                    <div className="mr-1 ml-1 flex">
                                        <span className="mt-3 mr-[1px] text-base">+{quests.happy_lunar_new_year._rewards.tokens.ELEM}</span>
                                        <img src={`/assets/images/ELEM.png`} width={50} height={50} alt="" />
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 flex w-full justify-center">
                                <button
                                    onClick={() => {
                                        const action = '_opened';
                                        const questName = 'happy_lunar_new_year';
                                        const apiPath = '/api/quests/open';

                                        axios
                                            .post(apiPath, { questName, action })
                                            .then((response) => {
                                                const { ELEM } = response.data;

                                                setWallet((prev: any) => ({ ...prev, ELEM: prev.ELEM + ELEM }));
                                                const getQuests = sessionStorage.getItem('quests');
                                                let quests = { happy_lunar_new_year: {} };

                                                try {
                                                    if (getQuests) {
                                                        quests = JSON.parse(getQuests);
                                                    }
                                                } catch { }

                                                const newQuests = { ...quests, happy_lunar_new_year: { ...quests.happy_lunar_new_year, [action]: true, _rewards: { tokens: { ELEM } } } };

                                                setQuests(newQuests);

                                                sessionStorage.setItem('quests', JSON.stringify(newQuests));
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                            });
                                    }}
                                    disabled={
                                        !quests.happy_lunar_new_year.retweet ||
                                        !quests.happy_lunar_new_year.like ||
                                        !quests.happy_lunar_new_year.retweet ||
                                        quests.happy_lunar_new_year._opened
                                    }
                                    type="button"
                                    className="justify-center btn btn-outline-white w-[300px] h-[20px] rounded-full hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]"
                                >
                                    {quests.happy_lunar_new_year._opened ? 'Opened' : 'Open'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        );
    },
};

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const user = (await getSession({ req }))?.user as JWT;

    const props: { serverStatus: number } = { serverStatus: 200 };

    if (user) {
        const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { referral_code: 1 } });
        if (!dbUser) {
            props.serverStatus = 403;
        } else if (!dbUser.referral_code) {
            props.serverStatus = 202;
        }
    } else props.serverStatus = 403;

    return { props };
}

const Index = ({ serverStatus }: { serverStatus: number }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    //@ts-ignore
    const { data: session, status }: Seesion = useSession();

    const [wallet, setWallet] = useState(session?.user?.wallet);

    const [showBag, setShowBag] = useState<boolean>(false);

    useEffect(() => {
        dispatch(setShowHeader(true));

        //@ts-ignore
        getSession().then((session: Seesion) => setWallet(session?.user?.wallet || { ELEM: 0 }));
    }, []);

    const [menu, setMenu] = useState('quest'); // quest - starter_pack - hidden_leaf - dojo_drill - exclusive_quest - happy_lunar_new_year
    const [quests, setQuests] = useState<any>();

    useEffect(() => {
        axios
            .post('/api/quests/get')
            .then((response) => {
                const defaultData = { starter_pack: {}, hidden_leaf: {}, dojo_drill: {}, exclusive_quest: {}, happy_lunar_new_year: {} };
                sessionStorage.setItem('quests', JSON.stringify({ ...defaultData, ...response.data }));
                setQuests({ ...defaultData, ...response.data });
            })
            .catch((error) => {
                error.response.status === 403 && signOut({ callbackUrl: '/' });
            });
    }, []);

    if (serverStatus === 202) {
        dispatch(setShowHeader(false));
        return <InvitePage />;
    }

    if (serverStatus === 403) return <Login />;

    if (status !== 'loading' && (status === 'unauthenticated' || !session)) return <Login />;

    const Menu = questMenus[menu];

    const starter_pack_doned =
        quests?.starter_pack.join_discord === true && quests?.starter_pack.follow && quests?.starter_pack.turn_on_notification && quests?.starter_pack.like && quests?.starter_pack.retweet;

    const hidden_leaf_doned = quests?.hidden_leaf.doned;

    const dojo_drill_doned = quests?.dojo_drill.day === 0;

    const exclusive_quest_doned = quests?.exclusive_quest.follow_injective === true && quests?.exclusive_quest.follow_dojoswap === true && quests?.exclusive_quest.like === true && quests?.exclusive_quest.retweet === true;

    const happy_lunar_new_year_doned =
        quests?.happy_lunar_new_year.tweet === true &&
        quests?.happy_lunar_new_year.retweet === true;

    return (
        status === 'authenticated' &&
        session && (
            <>
                {showBag && (
                    <div className="h-full max-h-[800px] w-full max-w-[400px] bg-white absolute z-10">
                        <div className='h-full max-h-[800px] w-full max-w-[375px] bg-white absolute z-10'><MyBag closeBag={() => setShowBag(false)} onUse={() => router.push('/')} /></div>
                    </div>
                )}
                <div className="mb-2 flex items-center overflow-y-auto border-b border-white-light font-semibold">
                    <div className="flex w-full mb-2">
                        <div className="flex w-full">
                            <div className="mr-2 ml-4 flex w-full">
                                <div className="w-8 mr-1">
                                    <img src={`/assets/images/ELEM.png`} alt="" />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm text-black`}>{formatPriceNumber(wallet?.ELEM || 0)}</span>
                                    <span className="text-xs">$ELEM</span>
                                </div>
                            </div>
                            <div className="flex w-full justify-end">
                                {/* <div className="mr-4 mt-2 w-[60px] hover:cursor-pointer" onClick={() => setShowBag(true)}>
                                    <div className="flex items-center">
                                        <img className="w-5 mr-1" src="/assets/images/chip.svg" alt="" />
                                        <span className="text-md opacity-[0.9] font-pixel">{session.user?.boosts.count || 0}</span>
                                    </div>
                                </div> */}
                                <div className="mr-4 w-[60px] hover:cursor-pointer" onClick={() => setShowBag(true)}>
                                    <div className="flex flex-col items-center">
                                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M9 2.72327H15V4.72327H9V2.72327ZM15 6.72327V4.72327H17V6.72327H21V8.72327V20.7233V22.7233H19H5H3V20.7233V8.72327V6.72327H7V4.72327H9V6.72327H15ZM15 8.72327H9V10.7233H7V8.72327H5V20.7233H19V8.72327H17V10.7233H15V8.72327Z"
                                                fill="black"
                                            />
                                        </svg>
                                        <span className="text-xs opacity-[0.8] font-pixel">My Bag</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {menu === 'quest' && quests && (
                    <div className="p-1 h-8 bg-[#f5f5f4] rounded-full">
                        <Tab.Group>
                            <Tab.List className="flex justify-center space-x-3 !text-[#f6f6f6]">
                                <Tab as={Fragment}>
                                    {({ selected }) => (
                                        <button
                                            className={`${selected ? '!bg-#[f5f5f5] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                                font-pixel text-xs font-black text-black rounded-full h-6 w-full hover:!bg-[#f5f5f5] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                        >
                                            Available Quests
                                        </button>
                                    )}
                                </Tab>
                                <Tab as={Fragment}>
                                    {({ selected }) => (
                                        <button
                                            className={`${selected ? '!bg-#[f5f5f5] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                            font-pixel text-xs font-black text-black rounded-full h-6 w-full hover:!bg-[#f5f5f5] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                        >
                                            Done Quests
                                        </button>
                                    )}
                                </Tab>
                            </Tab.List>
                            <Tab.Panels>
                                <Tab.Panel>
                                    <div className="mt-5 flex flex-col justify-center items-center">
                                        {!starter_pack_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('starter_pack')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">xNinja Free Starter Pack</h4>
                                                <p className="mb-4">Must-have luggage for all ‘newja’</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        One Time
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* {!hidden_leaf_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('hidden_leaf')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">The Way of the Hidden Leaf</h4>
                                                <p className="mb-4">Claim chests every day for training Ninja faster</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Daily
                                                    </div>
                                                </div>
                                            </div>
                                        )} LOCK_1 */}
                                        {!dojo_drill_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('dojo_drill')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">Daily Dojo Drill</h4>
                                                <p className="mb-4">Keep perseverance to become Master Ninja</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Daily
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* {!exclusive_quest_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('exclusive_quest')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">xNinja x Injective x Dojo Exclusive Quest</h4>
                                                <p className="mb-4">Together we push Ninja spirits and Injective ecosystem growth</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        One Time
                                                    </div>
                                                </div>
                                            </div>
                                        )} */}
                                        {/* {!happy_lunar_new_year_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[370px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('happy_lunar_new_year')}
                                            >
                                                <h4 className="mb-4 text-2xl font-pixel font-semibold">Happy Lunar New Year to all Ninjas 🥷</h4>
                                                <p className="mb-4 font-pixel">Wishing you a year filled with courage, strength, and epic victories as we soar into the Year of the Dragon with #xNinja and #Injective. 🐉✨</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[3.45px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        One Time
                                                    </div>
                                                </div>
                                            </div>
                                        )} */}
                                    </div>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <div className="mt-5 flex flex-col justify-center items-center">
                                        {starter_pack_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('starter_pack')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">xNinja Free Starter Pack</h4>
                                                <p className="mb-4">Must-have luggage for all ‘newja’</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* {hidden_leaf_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('hidden_leaf')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">The Way of the Hidden Leaf</h4>
                                                <p className="mb-4">Claim chests every day for training Ninja faster</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )} LOCK_1 */}
                                        {dojo_drill_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('dojo_drill')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">Daily Dojo Drill</h4>
                                                <p className="mb-4">Keep perseverance to become Master Ninja</p>
                                                <div className="flex w-full justify-end ">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {exclusive_quest_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[375px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('exclusive_quest')}
                                            >
                                                <h4 className="mb-4 text-2xl font-semibold">xNinja x Injective x Dojo Exclusive Quest</h4>
                                                <p className="mb-4">Together we push Ninja spirits and Injective ecosystem growth</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {happy_lunar_new_year_doned && (
                                            <div
                                                className={`mb-4 panel text-black w-full max-w-[370px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu('happy_lunar_new_year')}
                                            >
                                                <h4 className="mb-4 text-2xl font-pixel font-semibold">Happy Lunar New Year to all Ninjas 🥷</h4>
                                                <p className="mb-4 font-pixel">Wishing you a year filled with courage, strength, and epic victories as we soar into the Year of the Dragon with #xNinja and #Injective. 🐉✨</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                )}

                {!!Menu && <Menu backToQuest={() => setMenu('quest')} quests={quests} setQuests={setQuests} setWallet={setWallet} />}
            </>
        )
    );
};

export default Index;
