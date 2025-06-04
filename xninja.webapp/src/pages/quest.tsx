import { Fragment, useLayoutEffect, useState } from 'react';
import { User, signOut, useMeQuery } from '../hooks/useMeQuery';
import axios from 'axios';
import MyBag from './components/my_bag';
import { formatPriceNumber, roundDown } from './libs/custom';
import CryptoJS from 'crypto-js';
import { Tab } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import { setShowHeader } from '../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosApi from './libs/axios';

const createSignature = (params: any, secretKey: string) => {
    const timestamp = new Date().getTime();

    let data = `timestamp${timestamp + Number(import.meta.env.VITE_SIGN_CODE)}${timestamp}`;

    Object.keys(params).forEach((key) => {
        data += `&${key}${timestamp + Number(import.meta.env.VITE_SIGN_CODE)}${params[key]}`;
    });

    const signature = CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Hex);

    return { timestamp, signature };
};

function getRandomInteger(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const OneTimeQuest = ({ backToQuest, user, quest_name, quest_value, reloadMe }: { backToQuest: () => void; user: User; quest_name: string; quest_value: { [key: string]: [string, any] }; reloadMe: () => void }): JSX.Element => {
    const [activeQuests, setActiveQuests] = useState<{ [key: string]: boolean }>({});

    const tasks = Object.entries(quest_value.tasks);

    return (
        <div className="p-2 flex flex-col w-[375px] xxs:w-[430px] xs:w-[500px]">
            <div className="mb-2 flex">
                <svg onClick={backToQuest} className="cursor-pointer mt-[2px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                    <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                </svg>
                <span className={`ml-2 text-base font-bold text-black`}>{quest_value.title}</span>
            </div>
            <div className={`panel rounded-lg !text-black w-full !bg-[#f5f5f5] flex flex-col`}>
                {tasks.map(([task_name, task_value], index) => {
                    const disabled = (user.quests && user.quests[quest_name] && user.quests[quest_name][task_name] === true);

                    return (
                        <div key={index} className={`flex w-full ${(index !== (tasks.length - 1)) ? 'overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold mb-5' : ''}`}>
                            <div className={`flex w-full ${(index !== (tasks.length - 1)) ? 'mb-5' : ''} text-sm`} dangerouslySetInnerHTML={{ __html: task_value.item_html }}></div>
                            <div className="flex justify-end right">
                                {task_value.item_type === 'JOIN_DISCORD' && (
                                    <button
                                        disabled={disabled}
                                        onClick={() => {
                                            if (!(user.quests && user.quests[quest_name] && user.quests[quest_name][task_name] === 'unchecked')) {
                                                const action = task_name;
                                                const state = 'unchecked';
                                                const questName = quest_name;
                                                const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/set`;
                                                const questUrls = task_value.questUrls;

                                                const questUrl = questUrls[getRandomInteger(0, questUrls.length - 1)];

                                                window.open(questUrl);

                                                const jsonQuestUrl = JSON.stringify(questUrls);

                                                const params = { questName, questUrl: jsonQuestUrl, action };

                                                const secret = CryptoJS.SHA256(String(jsonQuestUrl + user?.tw_id)).toString(CryptoJS.enc.Hex);

                                                const { timestamp, signature } = createSignature(params, secret);

                                                axiosApi
                                                    .post(apiPath, { questName, action, state, timestamp, queryId: signature })
                                                    .then(() => {
                                                        setTimeout(reloadMe, 1000);
                                                    })
                                                    .catch((error) => {
                                                        if (axios.isAxiosError(error) && error.response) {
                                                            if (error.response.status === 403) {
                                                                signOut(reloadMe);
                                                            };
                                                        };
                                                    });
                                            } else if ((user.quests && user.quests[quest_name] && user.quests[quest_name][task_name] === 'unchecked')) {
                                                localStorage.setItem('xninja-auth_type', task_name);
                                                const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${task_value.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
                                                    task_value.DISCORD_REDIRECT_WEB_URI
                                                )}&response_type=token&scope=guilds.join+identify+guilds+guilds.members.read`;
                                                window.location.href = discordLoginUrl;
                                            }
                                        }}
                                        type="button"
                                        className="btn btn-outline-white h-[20px] rounded-full text-xs"
                                    >
                                        {disabled && (
                                            <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                            </svg>
                                        )}
                                        {(user.quests && user.quests[quest_name] && user.quests[quest_name][task_name] === 'unchecked') && 'Check'}
                                        {!(user.quests && user.quests[quest_name] && user.quests[quest_name][task_name]) && 'Go'}
                                    </button>
                                )}
                                {(task_value.item_type !== 'JOIN_DISCORD' && <button
                                    disabled={disabled || activeQuests[task_name] === true}
                                    onClick={() => {
                                        setActiveQuests((prev) => ({ ...prev, [task_name]: true }));
                                        const action = task_name;
                                        const questName = quest_name;
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/set`;
                                        const questUrls = task_value.questUrls;

                                        const questUrl = questUrls[getRandomInteger(0, questUrls.length - 1)];

                                        window.open(questUrl);

                                        const jsonQuestUrl = JSON.stringify(questUrls);

                                        const params = { questName, questUrl: jsonQuestUrl, action };

                                        const secret = CryptoJS.SHA256(String(jsonQuestUrl + user?.tw_id)).toString(CryptoJS.enc.Hex);

                                        const { timestamp, signature } = createSignature(params, secret);

                                        axiosApi
                                            .post(apiPath, { questName, action, timestamp, queryId: signature })
                                            .then(() => {
                                                setTimeout(() => {
                                                    setActiveQuests((prev) => ({ ...prev, [task_name]: false }));
                                                    reloadMe();
                                                }, 10000);
                                            })
                                            .catch((error) => {
                                                if (axios.isAxiosError(error) && error.response) {
                                                    if (error.response.status === 403) {
                                                        signOut(reloadMe);
                                                    }
                                                }
                                            });
                                    }}
                                    type="button"
                                    className="btn btn-outline-white h-[20px] rounded-full"
                                >
                                    {activeQuests[task_name] === true ? (
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
                                    ) : (user.quests && user.quests[quest_name] && user.quests[quest_name][task_name]) ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                        </svg>
                                    ) : (
                                        'Go'
                                    )}
                                </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className={`panel mt-5 rounded-lg !text-black w-full !bg-[#f5f5f5] flex flex-col`}>
                <span className="mb-2 flex">
                    Reward {(user.quests && user.quests[quest_name] && user.quests[quest_name]?._opened) && <img src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/opened_chest.png" width={25} height={25} alt="" />}
                </span>
                <span className="overflow-y-auto whitespace-nowrap border-b border-white-light mb-5"></span>
                <div className="flex flex-col w-full">
                    {!(user.quests && user.quests[quest_name] && user.quests[quest_name]?._opened) && (
                        <div className="flex w-full justify-center">
                            <img src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/transparent_treasure_chest.png" width={100} height={100} alt="" />
                        </div>
                    )}
                    {user.quests && user.quests[quest_name] && user.quests[quest_name]?._opened && (
                        <div className="flex w-full justify-center">
                            {(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.tokens?.ELEM && <div className="mr-1 ml-1 flex">
                                <span className="mt-3 mr-[1px] text-base">+{(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.tokens.ELEM}</span>
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} width={50} height={50} alt="" />
                            </div>}
                            {(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods?.rice && <div className="mr-1 ml-1 flex">
                                <span className="mt-3 mr-[1px] text-base">+{(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods.rice}</span>
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/rice.svg`} width={50} height={50} alt="" />
                            </div>}
                            {(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods?.miso_soup && <div className="mr-1 ml-1 flex">
                                <span className="mt-3 mr-[1px] text-base">+{(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods.miso_soup}</span>
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/miso_soup.svg`} width={50} height={50} alt="" />
                            </div>}
                            {(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods?.meat && <div className="mr-1 ml-1 flex">
                                <span className="mt-3 mr-[1px] text-base">+{(user.quests && user.quests[quest_name] && user.quests[quest_name])?._rewards?.foods.meat}</span>
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/meat.svg`} width={50} height={50} alt="" />
                            </div>}
                        </div>
                    )}
                    <div className="mt-5 flex w-full justify-center">
                        <button
                            onClick={() => {
                                const action = '_opened';
                                const questName = quest_name;
                                const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                axiosApi
                                    .post(apiPath, { questName, action })
                                    .then(() => {
                                        toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                        reloadMe();
                                    })
                                    .catch((error) => {
                                        error.response.status === 403 && signOut(reloadMe);
                                    });
                            }}
                            disabled={(user.quests && user.quests[quest_name] && user.quests[quest_name]?._opened) || (Object.keys(quest_value.tasks).findIndex(taskValue => !(user.quests && user.quests[quest_name] && user.quests[quest_name][taskValue] === true)) !== -1)}
                            type="button"
                            className="justify-center btn btn-outline-white w-[300px] h-[20px] rounded-full hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]"
                        >
                            {(user.quests && user.quests[quest_name] && user.quests[quest_name])?._opened ? 'Opened' : 'Open'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

const questMenus: {
    [key: string]: ({ backToQuest, user }: { backToQuest: () => void; user: User; reloadMe: () => void }) => JSX.Element;
} = {
    dojo_drill: ({ backToQuest, user, reloadMe }) => {
        const day = user.quests?.dojo_drill?.day;
        const claim_at = user.quests?.dojo_drill?.claim_at && new Date(user.quests?.dojo_drill?.claim_at);

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
            <div className="p-2 flex flex-col">
                <div className="mb-2 flex">
                    <svg onClick={backToQuest} className="cursor-pointer mt-[2px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-base font-bold text-black`}>Daily Dojo Drill</span>
                </div>
                <div className="flex flex-wrap justify-center overflow-y-auto scrollbar-hide">
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 1</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={user.appConfig.data.CONFIG_FOODS.rice.image} />
                            <span className="text-xs font-ibm">1x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!day_1 && !another}
                                    onClick={() => {
                                        const action = 'day_1';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {typeof user.quests?.dojo_drill?.day !== 'number' || day === 7 || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 2</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={user.appConfig.data.CONFIG_FOODS.rice.image} />
                            <span className="text-xs font-ibm">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_2 || another)}
                                    onClick={() => {
                                        const action = 'day_2';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 1 || !day_2) && (typeof day !== 'number' || day < 2)) || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 3</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={user.appConfig.data.CONFIG_FOODS.miso_soup.image} />
                            <span className="text-xs font-ibm">1x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_3 || another)}
                                    onClick={() => {
                                        const action = 'day_3';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 2 || !day_3) && (typeof day !== 'number' || day < 3)) || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 4</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} />
                            <span className="text-xs font-ibm">2 ELEM</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_4 || another)}
                                    onClick={() => {
                                        const action = 'day_4';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 3 || !day_4) && (typeof day !== 'number' || day < 4)) || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 5</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={user.appConfig.data.CONFIG_FOODS.miso_soup.image} />
                            <span className="text-xs font-ibm">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_5 || another)}
                                    onClick={() => {
                                        const action = 'day_5';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 4 || !day_5) && (typeof day !== 'number' || day < 5)) || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md">
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 6</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={user.appConfig.data.CONFIG_FOODS.meat.image} />
                            <span className="text-xs font-ibm">2x</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_6 || another)}
                                    onClick={() => {
                                        const action = 'day_6';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 5 || !day_6) && (typeof day !== 'number' || day < 6)) || another ? (
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
                    <div className="ml-[5px] mt-[5px] transition-all duration-100 hover:cursor-pointer px-1 py-1 w-[150px] h-auto bg-[#f5f5f4] rounded-md" onClick={() => { }}>
                        <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">Day 7</span>
                        </div>
                        <div className="w-full h-full flex flex-col items-center">
                            <img className="w-14" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} />
                            <span className="text-xs font-ibm">10 ELEM</span>
                            <div className="flex w-full mt-1 items-center justify-center">
                                <button
                                    className="btn !bg-#[f5f5f5] mt-2 text-xs h-6 !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)] hovershadow-[0_0px_5px_0_rgba(0,0,0,0.50)]"
                                    disabled={!!(!day_7 || another)}
                                    onClick={() => {
                                        const action = 'day_7';
                                        const questName = 'dojo_drill';
                                        const apiPath = `${import.meta.env.VITE_API_URL}/api/quests/open`;

                                        axiosApi
                                            .post(apiPath, { questName, action })
                                            .then(() => {
                                                toast.success('Claimed reward successfully. Check your bag!', { duration: 3000, className: 'font-ibm text-xs' });
                                                reloadMe();
                                            })
                                            .catch((error) => {
                                                error.response.status === 403 && signOut(reloadMe);
                                            });
                                    }}
                                >
                                    {((user.quests?.dojo_drill?.day === 6 || !day_7) && (typeof day !== 'number' || day < 7)) || another ? (
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
    hidden_leaf: ({ backToQuest }) => {
        return (
            <div className="p-2 flex flex-col font-ibm">
                <div className="mb-2 flex">
                    <svg onClick={backToQuest} className="cursor-pointer mt-[2px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-base font-bold text-black`}>The Way of the Hidden Leaf</span>
                </div>
                <div className={`panel rounded-lg !text-black w-full border !bg-white flex flex-col`}>
                    <div className="panel p-2 mb-5 h-18 flex flex-col rounded-xl border text-black justify-between">
                        <div className='flex w-full p-1'>
                            <span className="w-full text-sm text-blue-500 hover:cursor-pointer">https://twitter.com/xninja_tech</span>
                            <a className="btn btn-outline-white h-[20px] rounded-full" href="https://twitter.com/xninja_tech" target='_blank'>Go</a>
                        </div>
                    </div>
                    <p className="text-gray-700 text-base mb-4">
                        Every day you can claim 2 Treasures in our Twitter profile. Opening a chest can bring you some $ELEM or some good stuffs to take care of your Ninja
                    </p>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold mb-2">Rewards</h2>
                        <div className="flex">
                            <div className="h-14 w-14 flex items-center justify-center ">
                                <img src='https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg'></img>
                            </div>
                            <div className="h-14 w-14 flex items-center justify-center mx-2">
                                <img src='https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg'></img>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-700 text-base mb-4">
                        To complete this Quest, you need to use Google Chrome browser (or other Chromium browsers that support installing Chrome extensions like Microsoft Edge) to install xNinja.Tech extension.
                    </p>
                </div>
            </div>
        );
    },
};

const Index = () => {
    const { data: user, coinlist, loadingCoinList, reload: reloadMe, loading } = useMeQuery('tw_id quests wallet addresses');
    const [wallet, setWallet] = useState<{ ELEM: number, INJ: number }>({ ELEM: 0, INJ: 0 });
    const [showBag, setShowBag] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [quests, setQuests] = useState<Record<string, any>>({});

    useLayoutEffect(() => {
        toast.remove();
        dispatch(setShowHeader(true));
    }, []);

    useLayoutEffect(() => {
        if (user) {
            setQuests(
                //@ts-ignore
                Object.entries(user.appConfig.data.quests).reduce((previousValue, [quest_name, quest_value], index) => {
                    const value = quest_value as any;
                    if (value.quest_type === 'DAILY' || value.quest_type === 'EXT') {
                        const DefaultQuest = questMenus[quest_name];

                        return { ...previousValue, [quest_name]: <DefaultQuest key={index} backToQuest={() => setMenu('quest')} user={user} reloadMe={reloadMe} /> };
                    };
                    return { ...previousValue, [quest_name]: <OneTimeQuest key={index} backToQuest={() => setMenu('quest')} user={user} reloadMe={reloadMe} quest_name={quest_name} quest_value={value} /> };

                }, {}));
        };
    }, [user]);

    useLayoutEffect(() => {
        if (user && !loadingCoinList) {
            const ELEM = coinlist.find((value) => value.token === 'ELEM');
            const INJ = coinlist.find((value) => value.token === 'INJ');

            setWallet((prev) => ({ ...prev, ELEM: (user.wallet?.ELEM || 0) + (Number(ELEM?.balance) || 0), INJ: Number(INJ?.balance) || 0 }));
        };
    }, [user, loadingCoinList]);

    const [menu, setMenu] = useState<string>('quest');


    if (loading || !user) return <></>;

    const Menu = quests[menu];

    return (
        <>
            {showBag && (
                <div className="w-full h-[1024px] max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] bg-white absolute z-20">
                    <MyBag
                        user={user}
                        closeBag={() => {
                            setShowBag(false);
                            dispatch(setShowHeader(true));
                        }}
                        onUse={() => navigate('/')}
                    />
                </div>
            )}
            <div className="xs:px-4 pt-4 pb-2 flex items-center overflow-y-auto border-b border-white-light font-ibm w-[375px] xxs:w-[430px] xs:w-[500px]">
                <div className='flex w-full justify-between'>
                    <div className="flex">
                        <div className="flex p-2">
                            <div className="w-9 bg-[#D9D9D9] rounded-full">
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                            </div>
                            <div className="flex flex-col pl-2">
                                <span className={`text-sm text-[#000]`} style={{ fontWeight: 700 }}>
                                    {loadingCoinList ? (
                                        <svg
                                            style={{ marginTop: '4px', marginBottom: '2px' }}
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
                                    ) : (
                                        wallet?.ELEM ? formatPriceNumber(Number(roundDown(wallet.ELEM, 2)), 2) : '0.00'
                                    )}
                                </span>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }} >$ELEM</span>
                            </div>
                        </div>
                        <div className="flex p-2">
                            <div className="w-9 bg-[#D9D9D9] rounded-full">
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png`} alt="" />
                            </div>
                            <div className="flex flex-col pl-2">
                                <span className={`text-sm text-[#000]`} style={{ fontWeight: 700 }}>
                                    {loadingCoinList ? (
                                        <svg
                                            style={{ marginTop: '4px', marginBottom: '2px' }}
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
                                    ) : (
                                        wallet?.INJ ? formatPriceNumber(Number(roundDown(wallet.INJ, 2)), 2) : '0.00'
                                    )}
                                </span>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }} >$INJ</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center font-ibm">
                        {/* <div
                            className="hover:cursor-pointer p-2"
                        >
                            <div className="flex flex-col items-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.33335 6.66683V5.8335M8.33335 10.4168V9.5835M8.33335 14.1668V13.3335M4.33335 3.3335H15.6667C16.6001 3.3335 17.0668 3.3335 17.4233 3.51515C17.7369 3.67494 17.9919 3.92991 18.1517 4.24351C18.3334 4.60003 18.3334 5.06674 18.3334 6.00016V7.0835C16.7225 7.0835 15.4167 8.38933 15.4167 10.0002C15.4167 11.611 16.7225 12.9168 18.3334 12.9168V14.0002C18.3334 14.9336 18.3334 15.4003 18.1517 15.7568C17.9919 16.0704 17.7369 16.3254 17.4233 16.4852C17.0668 16.6668 16.6001 16.6668 15.6667 16.6668H4.33335C3.39993 16.6668 2.93322 16.6668 2.5767 16.4852C2.2631 16.3254 2.00813 16.0704 1.84834 15.7568C1.66669 15.4003 1.66669 14.9336 1.66669 14.0002V12.9168C3.27752 12.9168 4.58335 11.611 4.58335 10.0002C4.58335 8.38933 3.27752 7.0835 1.66669 7.0835V6.00016C1.66669 5.06674 1.66669 4.60003 1.84834 4.24351C2.00813 3.92991 2.2631 3.67494 2.5767 3.51515C2.93322 3.3335 3.39993 3.3335 4.33335 3.3335Z" stroke="black" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                <span className="text-xs opacity-[0.8]">{user.boosts?.count || 0}</span>
                            </div>
                        </div> */}
                        <div
                            className="hover:cursor-pointer p-2"
                            onClick={() => {
                                dispatch(setShowHeader(false));
                                setShowBag(true);
                            }}
                        >
                            <div className="flex flex-col items-center">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.333 5.66667C12.333 6.55072 11.9818 7.39857 11.3567 8.02369C10.7315 8.64881 9.88369 9 8.99964 9C8.11558 9 7.26774 8.64881 6.64261 8.02369C6.01749 7.39857 5.6663 6.55072 5.6663 5.66667M2.02732 5.16782L1.44399 12.1678C1.31867 13.6716 1.25601 14.4235 1.51021 15.0035C1.73354 15.5131 2.12049 15.9336 2.60979 16.1985C3.1667 16.5 3.92119 16.5 5.43017 16.5H12.5691C14.0781 16.5 14.8326 16.5 15.3895 16.1985C15.8788 15.9336 16.2657 15.5131 16.4891 15.0035C16.7433 14.4235 16.6806 13.6716 16.5553 12.1678L15.972 5.16782C15.8641 3.87396 15.8102 3.22703 15.5237 2.73738C15.2714 2.3062 14.8957 1.9605 14.445 1.74487C13.9333 1.5 13.2841 1.5 11.9858 1.5L6.0135 1.5C4.71516 1.5 4.06598 1.5 3.55423 1.74487C3.10359 1.9605 2.72788 2.3062 2.47557 2.73738C2.18905 3.22703 2.13514 3.87396 2.02732 5.16782Z" stroke="black" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }} >My Bag</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {menu === 'quest' && !showBag && (
                <div className="p-1 h-8 mt-2 bg-[#f5f5f4] rounded-full w-full max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                    <Tab.Group>
                        <Tab.List className="flex justify-center space-x-3 !text-[#f6f6f6]">
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`${selected ? '!bg-#[f5f5f5] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                                font-ibm text-xs font-black text-black rounded-full h-6 w-full hover:!bg-[#f5f5f5] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                    >
                                        Available Quests
                                    </button>
                                )}
                            </Tab>
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`${selected ? '!bg-#[f5f5f5] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                            font-ibm text-xs font-black text-black rounded-full h-6 w-full hover:!bg-[#f5f5f5] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                    >
                                        Done Quests
                                    </button>
                                )}
                            </Tab>
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel>
                                <div className="mt-5 flex flex-col w-full justify-center items-center max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                                    {Object.entries(user.appConfig.data.quests).map(([quest_name, quest_value]: [string, any], index) => {
                                        if (quest_value.quest_type === 'EXT') return (
                                            <div
                                                key={index}
                                                className={`mb-4 panel text-black w-full max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu(quest_name)}
                                            >
                                                <h4 className="mb-4 text-2xl font-ibm font-semibold">{quest_value.title}</h4>
                                                <p className="mb-4 font-ibm">{quest_value.description}</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[3.45px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Daily
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                        if (quest_value.quest_type === 'DAILY') return (
                                            <div
                                                key={index}
                                                className={`mb-4 panel text-black w-full max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu(quest_name)}
                                            >
                                                <h4 className="mb-4 text-2xl font-ibm font-semibold">{quest_value.title}</h4>
                                                <p className="mb-4 font-ibm">{quest_value.description}</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-secondary/20 border-secondary px-2 py-1 text-sm font-semibold text-secondary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ltr:mr-1 rtl:ml-1 mt-[3.45px]">
                                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Daily
                                                    </div>
                                                </div>
                                            </div>
                                        );

                                        if (quest_value.quest_type === 'ONE_TIME') return (
                                            (Object.keys(quest_value.tasks).findIndex(taskValue => !(user.quests && user.quests[quest_name] && user.quests[quest_name][taskValue] === true)) !== -1) && <div
                                                key={index}
                                                className={`mb-4 panel text-black w-full max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu(quest_name)}
                                            >
                                                <h4 className="mb-4 text-2xl font-ibm font-semibold">{quest_value.title}</h4>
                                                <p className="mb-4 font-ibm">{quest_value.description}</p>
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
                                        )
                                    })}
                                </div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="mt-5 flex flex-col w-full justify-center items-center max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                                    {Object.entries(user.appConfig.data.quests).map(([quest_name, quest_value]: [string, any], index) => {
                                        if (quest_value.quest_type === 'EXT') return null;
                                        if (quest_value.quest_type === 'ONE_TIME') return (
                                            (Object.keys(quest_value.tasks).findIndex(taskValue => !(user.quests && user.quests[quest_name] && user.quests[quest_name][taskValue] === true)) === -1) && <div
                                                key={index}
                                                className={`mb-4 panel text-black w-full max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px] !bg-[#f5f5f5] hover:cursor-pointer hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] hover:opacity-[0.9]`}
                                                onClick={() => setMenu(quest_name)}
                                            >
                                                <h4 className="mb-4 text-2xl font-ibm font-semibold">{quest_value.title}</h4>
                                                <p className="mb-4 font-ibm">{quest_value.description}</p>
                                                <div className="flex w-full justify-end">
                                                    <div className="flex rounded-full bg-success/20 border-success px-2 py-1 text-sm font-semibold text-success">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 448 512" fill="#00ab55" className="ltr:mr-1 rtl:ml-1 mt-[5px]">
                                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                                        </svg>
                                                        Done
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            )}
            {Menu}
            <Toaster />
        </>
    );
};

export default Index;
