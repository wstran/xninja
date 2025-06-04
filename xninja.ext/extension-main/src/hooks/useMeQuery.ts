import { BACKEND_API } from '@/config';
import { useLayoutEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { ethers } from 'ethers';
import axiosApi from '../libs/axios';

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
    quests?: {
        starter_pack?: {
            join_discord: boolean | 'unchecked';
            follow: boolean;
            turn_on_notification: boolean;
            like: boolean;
            retweet: boolean;
            _opened: boolean;
            _rewards?: { tokens: { ELEM: number } };
        };
        dojo_drill?: {
            day: number;
            claim_at: Date;
        };
        happy_chinese_new_year?: {
            tweet: boolean;
            like: boolean;
            retweet: boolean;
            _opened: boolean;
            _rewards?: { tokens: { ELEM: number } };
        };
    };
    invite_code: string;
    rewards?: { ELEM: number };
    user_ninjas: UserNinja[];
    user_refs?: { tw_id: string; referral_date: Date }[];
    appConfig: {
        borrow_state: 'enable' | 'pause' | 'disable';
        convert_elem_to_xnj_state: 'enable' | 'disable';
        convert_xnj_to_elem_state: 'enable' | 'disable';
        borrow_percent: number;
        XNJ_price: number;
        allow_earn_claim: boolean;
        allow_referral_claim: boolean;
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
            .get<any, AxiosResponse<User>>(`${BACKEND_API}/me`, { params: { projection, message } })
            .then((response) => {
                if (response.data) setData(response.data);

                if (response.data.addresses) {
                    axiosApi
                        .get(`${BACKEND_API}/api/blockchain/fetch-balance`, {
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
                                }
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
    return axiosApi.get<any, AxiosResponse<User>>(`${BACKEND_API}/me`, { params: { projection } });
};

export const signOut = (callback: () => void) => {
    if (process.env.NODE_ENV === 'development') {
        axiosApi
            .post(`${BACKEND_API}/signout`)
            .then(callback)
            .catch((error) => {
                console.error(error);
            });
    } else {
        chrome.storage.local.remove("xninja-auth_token");
        callback && callback();
    };
};