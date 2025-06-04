import { useLayoutEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { ethers } from 'ethers';
import axiosApi from '../pages/libs/axios';

interface UserNinja {
    _id: string;
    class: string;
    level: number;
    mana: string;
    farm_at: string;
    created_at: string;
}

export type User = {
    type: 'local' | 'twitter';
    tw_id: string;
    name: string;
    username: string;
    profile_image_url: string;
    addresses: { injectiveAddress: string; ethereumAddress: string };
    two_factor_enabled: boolean;
    wallet: { ELEM: number };
    discordId: string;
    referral_code?: string;
    boosts?: { count: number; date: string };
    inventorys: { rice?: number; miso_soup?: number; meat?: number };
    quests?: any; /*  | {
        starter_pack?: {
            join_discord: boolean | 'unchecked';
            follow: boolean;
            turn_on_notification: boolean;
            like: boolean;
            retweet: boolean;
            _opened: boolean;
            _rewards?: { tokens?: { ELEM: number }, foods?: { rice: number; miso_soup: number; meat: number } };
        };
        dojo_drill?: {
            day: number;
            claim_at: Date;
        };
        hidden_leaf?: {
            count: number;
            claimed_at: string;
        };
        injective_quest_social_task: {
            follow_injective: boolean;
            follow_xninja: boolean;
            like: boolean;
            retweet: boolean;
            tweet: boolean;
            join_injective_discord: string | boolean;
            _opened: boolean;
            _rewards?: { tokens: { ELEM: number } };
        };
    }; */
    invite_code: string;
    rewards?: { ELEM: number };
    user_ninjas: UserNinja[];
    user_refs?: { tw_id: string; referral_date: Date }[];
    appConfig: {
        borrow_state: 'enable' | 'pause' | 'disable';
        convert_elem_to_xnj_state: 'enable' | 'pause' | 'disable';
        convert_xnj_to_elem_state: 'enable' | 'pause' | 'disable';
        borrow_percent: number;
        XNJ_price: number;
        allow_earn_claim: boolean;
        allow_referral_claim: boolean;
        min_user_convert: number;
        max_user_convert: number;
        data: { [key: string]: any };
    };
    syncData: { [key: string]: any };
};

const initialCoins = [
    {
        id: 1,
        token: 'INJ',
        balance: '0',
        isLoading: true,
        icon: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png',
        iconBackground: 'bg-blue-500',
    },
    {
        id: 2,
        token: 'XNJ',
        balance: '0',
        isLoading: true,
        icon: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png',
        iconBackground: 'bg-gray-400',
    },
    {
        id: 3,
        token: 'ELEM',
        balance: '0',
        isLoading: true,
        icon: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png',
        iconBackground: 'bg-green-500',
    },
];

export function useMeQuery(projection?: string, message?: string) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<User | null>(null);
    const [coinlist, setCoinlist] = useState(initialCoins);
    const [loadingCoinList, setLoadingCoinList] = useState<boolean>(true);
    const [_reload, setReload] = useState(0);

    useLayoutEffect(() => {
        _reload === 0 && setLoading(true);
        axiosApi
            .get<any, AxiosResponse<User>>(`${import.meta.env.VITE_API_URL}/me`, { params: { projection, message } })
            .then((response) => {
                if (response.data) setData(response.data);

                if (_reload === 0 && response.data.addresses) {
                    axiosApi
                        .get(`${import.meta.env.VITE_API_URL}/api/blockchain/fetch-balance`, {
                            params: { injectiveAddress: response.data.addresses.injectiveAddress },
                        })
                        .then((response) => {
                            const fetchedBalances = response.data;
                            const updatedCoinlist = coinlist.map((event) => {
                                if (fetchedBalances[event.token]) {
                                    return {
                                        ...event,
                                        balance: ethers.formatEther(fetchedBalances[event.token].balance),
                                        isLoading: false,
                                    };
                                } else {
                                    return {
                                        ...event,
                                        balance: '0',
                                        isLoading: false,
                                    };
                                };
                            });

                            setCoinlist(updatedCoinlist);
                        })
                        .catch((error) => {
                            console.error('Error fetching balances', error);
                        })
                        .finally(() => setLoadingCoinList(false));
                };
            })
            .catch((err) => {
                setData(null);
                setError(err.message || 'Not Authenticated');
            })
            .finally(() => setLoading(false));
    }, [_reload]);

    return { error, data, coinlist, loading, loadingCoinList, reload: () => setReload((prev) => prev + 1) };
}

export function getMeQuery(projection: string) {
    return axiosApi.get<any, AxiosResponse<User>>(`${import.meta.env.VITE_API_URL}/me`, { params: { projection } });
};

export function signOut(callback: () => void) {
    chrome.storage.local.remove('xninja-auth_token');
    callback && callback();
};