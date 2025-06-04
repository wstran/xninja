import { Fragment, useEffect, useLayoutEffect, useState } from 'react';
import { useMeQuery, signOut } from '../hooks/useMeQuery';
import toast, { Toaster } from 'react-hot-toast';
import { formatPriceNumber, roundDown } from './libs/custom';
import { Banana, LevelUp, Sword } from './components/svg';
import { MainPanel, OptionPanel, UpgradePanel } from './components/classes_gif';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import MyBag from './components/my_bag';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '../store/themeConfigSlice';
import axiosApi from './libs/axios';

interface UserNinja {
    _id: string;
    class: string;
    level: number;
    mana: string;
    farm_at: string;
    created_at: string;
};

function getBoostData(CONFIG_BOOSTS: { [key: string]: any }, boosts: { count: number; date: string } | undefined) {
    if (!boosts) return null;

    const currentDate = new Date();

    const sortedKeys = Object.keys(CONFIG_BOOSTS)
        .map(Number)
        .sort((a, b) => a - b);

    for (let i = 0; i < sortedKeys.length; i++) {
        if (boosts.count < sortedKeys[i]) {
            const data = CONFIG_BOOSTS[sortedKeys[i - 1]];

            return data && (currentDate.getTime() - Date.parse(boosts.date)) / (24 * 60 * 60 * 1000) < data.day ? data.boost : null;
        }
    }

    return CONFIG_BOOSTS[sortedKeys[sortedKeys.length - 1]].boost;
}

const Index = () => {
    const { data: user, coinlist, loadingCoinList, reload: reloadMe, loading } = useMeQuery('wallet addresses boosts');
    const [wallet, setWallet] = useState<{ ELEM: number, INJ: number }>({ ELEM: 0, INJ: 0 });
    const [ninjas, setNinjas] = useState<any[]>([]);
    const [ninja, setNinja] = useState<UserNinja | null>();
    const [showBag, setShowBag] = useState<boolean>(false);
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        if (!loading && user?.wallet) {
            setWallet(prev => ({ ...prev, ...user.wallet }));
        };
    }, [loading]);

    useLayoutEffect(() => {
        if (!loadingCoinList) {
            const ELEM = coinlist.find((value) => value.token === 'ELEM');
            const INJ = coinlist.find((value) => value.token === 'INJ');
            setWallet((prev) => ({ ...prev, ELEM: prev.ELEM + (Number(ELEM?.balance) || 0), INJ: Number(INJ?.balance) || 0 }));
        };
    }, [loadingCoinList]);

    useLayoutEffect(() => {
        toast.remove();
        dispatch(setShowHeader(true));
    }, []);

    useLayoutEffect(() => {
        axiosApi
            .get(`${import.meta.env.VITE_API_URL}/api/ninjas`)
            .then((response: { data: UserNinja[] }) => {
                response.data.sort((a, b) => b.level - a.level);
                setNinjas(response.data);
                setNinja(response.data[0]);
            })
            .catch(reloadMe);
    }, []);

    const [farmData, setFarmData] = useState(() => {
        const now = Date.now();

        if (!user) return { earned: 0, total_earn_speed_hour: 0 };

        return ninjas.reduce(
            (previousValue, currentValue) => {
                let earned = 0;
                let total_earn_speed_hour = 0;

                const farm_at = Date.parse(currentValue.farm_at);
                const mana = Date.parse(currentValue.mana);
                const balance = currentValue.balance;
                const _class = currentValue.class;
                const level = currentValue.level;
                const boost = getBoostData(user.appConfig.data.CONFIG_BOOSTS as { [key: string]: any }, user?.boosts) || 0;

                if (farm_at) {
                    if (now >= mana) {
                        if ((user.appConfig.data.LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                            const balance = ((mana - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                            earned += balance + (balance * boost) / 100;
                        }
                    } else {
                        if (user.appConfig.data.LEVEL_NINJAS[_class][level]) {
                            const balance = ((now - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                            earned += balance + (balance * boost) / 100;
                        }
                        total_earn_speed_hour += user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour + (user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
                    }
                }

                earned += balance || 0;

                return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
            },
            { earned: 0, total_earn_speed_hour: 0 }
        );
    });

    useEffect(() => {
        let intervalId: undefined | NodeJS.Timeout;

        if (!showBag) {
            const now = Date.now();

            const { earned, total_earn_speed_hour } = ninjas.reduce(
                (previousValue, currentValue) => {
                    if (user) {
                        let earned = 0;
                        let total_earn_speed_hour = 0;

                        const farm_at = Date.parse(currentValue.farm_at);
                        const mana = Date.parse(currentValue.mana);
                        const balance = currentValue.balance;
                        const _class = currentValue.class;
                        const level = currentValue.level;
                        const boost = getBoostData(user.appConfig.data.CONFIG_BOOSTS as { [key: string]: any }, user?.boosts) || 0;

                        if (farm_at) {
                            if (now >= mana) {
                                if ((user.appConfig.data.LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                                    const balance = ((mana - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                                    earned += balance + (balance * boost) / 100;
                                }
                            } else {
                                if (user.appConfig.data.LEVEL_NINJAS[_class][level]) {
                                    const balance = ((now - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                                    earned += balance + (balance * boost) / 100;
                                }
                                total_earn_speed_hour += user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour + (user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
                            }
                        }

                        earned += balance || 0;

                        return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
                    };
                    return previousValue;
                },
                { earned: 0, total_earn_speed_hour: 0 }
            );

            setFarmData({ earned, total_earn_speed_hour });

            intervalId = setInterval(() => {
                const now = Date.now();

                const { earned, total_earn_speed_hour } = ninjas.reduce(
                    (previousValue, currentValue) => {
                        if (user) {
                            let earned = 0;
                            let total_earn_speed_hour = 0;

                            const farm_at = Date.parse(currentValue.farm_at);
                            const mana = Date.parse(currentValue.mana);
                            const balance = currentValue.balance;
                            const _class = currentValue.class;
                            const level = currentValue.level;
                            const boost = getBoostData(user.appConfig.data.CONFIG_BOOSTS as { [key: string]: any }, user?.boosts) || 0;

                            if (farm_at) {
                                if (now >= mana) {
                                    if ((user.appConfig.data.LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                                        const balance = ((mana - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                                        earned += balance + (balance * boost) / 100;
                                    }
                                } else {
                                    if (user.appConfig.data.LEVEL_NINJAS[_class][level]) {
                                        const balance = ((now - farm_at) / (60 * 60 * 1000)) * user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour;
                                        earned += balance + (balance * boost) / 100;
                                    }
                                    total_earn_speed_hour += user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour + (user.appConfig.data.LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
                                }
                            }

                            earned += balance || 0;

                            return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
                        };
                        return previousValue;
                    },
                    { earned: 0, total_earn_speed_hour: 0 }
                );

                setFarmData({ earned, total_earn_speed_hour });
            }, 1000);
        };

        return () => clearInterval(intervalId);
    }, [user, ninjas, showBag]);

    const [addModal, setModal] = useState<any>(false);
    const [params, setParams] = useState<any>({});
    const [activeModal, setActiveModal] = useState<boolean>(false);
    const [activeClaim, setActiveClaim] = useState<boolean>(false);

    const is_farming = ninja && ninja.level > 4 && ninja.farm_at && Date.now() < Date.parse(ninja.mana);

    const showDialog = (data: any) => {
        setParams(data);
        setModal(true);
    };

    if (loading || !user) return <></>;

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
                        onUse={(item) => {
                            const id = ninja?._id;

                            if (!id) {
                                setShowBag(false);
                                dispatch(setShowHeader(true));
                                return;
                            }

                            axiosApi
                                .post(`${import.meta.env.VITE_API_URL}/api/games/feed`, { id, item })
                                .then((response) => {
                                    toast.success('Feed successfully!', { duration: 3000, className: 'font-ibm text-xs' });
                                    const mana = new Date(response.data.ninja.mana);
                                    mana.setTime(mana.getTime() - 5000);
                                    setNinja((prev: any) => ({ ...prev, mana: mana.toISOString(), farm_at: response.data.ninja.unset_farm_at ? null : prev.farm_at }));
                                    setNinjas((prev: any) =>
                                        prev.map((v: any) => (v._id === id ? { ...v, mana: mana.toISOString(), farm_at: response.data.ninja.unset_farm_at ? null : v.farm_at } : v))
                                    );
                                })
                                .catch((error) => {
                                    if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
                                        signOut(reloadMe);
                                    }
                                })
                                .finally(() => {
                                    setShowBag(false);
                                    dispatch(setShowHeader(true));
                                });
                        }}
                    />
                </div>
            )}
            <div className="xs:px-4 pt-4 pb-2 flex items-center overflow-y-auto border-b border-white-light font-ibm w-full">
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
            <div className="flex flex-col font-ibm max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                <div className="flex px-4 py-5 w-full justify-between">
                    <div className="flex flex-col self-center">
                        <span className={`text-sm`} style={{ fontWeight: 700 }}>Farming $ELEM ({formatPriceNumber(farmData.total_earn_speed_hour, 4) || 0}/h)</span>
                        <div className="flex items-center">
                            {' '}
                            <div className="w-6 mr-1 bg-[#D9D9D9] rounded-full">
                                <img src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                            </div>
                            <span className="text-sm text-[#78716C]" style={{ fontWeight: 400 }} >{farmData.earned > 0 ? formatPriceNumber(farmData.earned) : '0.00'}</span>
                        </div>
                    </div>
                    <button
                        className="self-center btn text-white text-xs rounded-full bg-[#000] w-24 h-10"
                        disabled={farmData.earned === 0 || activeClaim || !user.appConfig.allow_earn_claim}
                        onClick={() => {
                            setActiveClaim(true);
                            axiosApi
                                .post(`${import.meta.env.VITE_API_URL}/api/games/claim`)
                                .then((response) => {
                                    toast.success('Claim successfully!', { duration: 3000, className: 'font-ibm text-xs' });
                                    setWallet((prev) => ({ ...prev, ELEM: prev.ELEM + response.data.total_elem }));
                                    response.data.new_ninjas &&
                                        setNinjas((prev: any) =>
                                            prev.map((v: any) => {
                                                const newData = response.data.new_ninjas.find((value: { _id: string }) => value._id === v._id);
                                                return newData ? { ...v, balance: newData.balance, farm_at: newData.farm_at } : v;
                                            })
                                        );
                                })
                                .catch((error) => {
                                    if (axios.isAxiosError(error) && error.response) {
                                        if (error.response.status === 403) {
                                            signOut(reloadMe);
                                        } else if (error.response.status === 404) {
                                            if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                            };
                                            if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                            };
                                        } else if (error.response.status === 500) {
                                            toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                        };
                                    };
                                })
                                .finally(() => {
                                    setActiveClaim(false);
                                });
                        }}
                    >
                        {activeClaim && (
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
                        )}
                        Claim
                    </button>
                </div>
                <div className="flex justify-center max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                    <div className='absolute flex justify-between w-[375px] xxs:w-[430px] xs:w-[500px]'>
                        <div className="flex items-center justify-center px-6 py-3">
                            <svg width="130" height="41" viewBox="0 0 149 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="6.70557" y="0.574829" width="135.126" height="1.5214" fill="#451B0B" />
                                <rect x="6.70557" y="38.6074" width="135.126" height="1.5214" fill="#451B0B" />
                                <rect x="141.833" y="2.09814" width="2.52572" height="1.5214" fill="#451B0B" />
                                <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 6.70557 2.09814)" fill="#451B0B" />
                                <rect x="144.361" y="3.6189" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 4.18262 3.6189)" fill="#451B0B" />
                                <rect x="145.621" y="5.13684" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 2.92334 5.13684)" fill="#451B0B" />
                                <rect x="146.883" y="6.66016" width="1.26286" height="27.3851" fill="#451B0B" />
                                <rect width="1.26286" height="27.3851" transform="matrix(-1 0 0 1 1.65527 6.66016)" fill="#451B0B" />
                                <rect x="145.621" y="34.0454" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 2.92334 34.0454)" fill="#451B0B" />
                                <rect x="144.361" y="35.5687" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 4.18262 35.5687)" fill="#451B0B" />
                                <rect x="141.833" y="37.0868" width="2.52572" height="1.5214" fill="#451B0B" />
                                <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 6.70557 37.0868)" fill="#451B0B" />
                                <rect x="6.70557" y="2.09814" width="135.126" height="36.5135" fill="#BC8C61" />
                                <rect x="141.833" y="3.6189" width="2.52572" height="33.4707" fill="#BC8C61" />
                                <rect x="144.361" y="5.13684" width="1.26286" height="30.4279" fill="#BC8C61" />
                                <rect x="145.621" y="6.66016" width="1.26286" height="27.3851" fill="#BC8C61" />
                                <rect x="1.65527" y="6.66016" width="1.26286" height="27.3851" fill="#BC8C61" />
                                <rect x="2.92334" y="5.13684" width="1.26286" height="30.4279" fill="#BC8C61" />
                                <rect x="4.18262" y="3.6189" width="2.52572" height="33.4707" fill="#BC8C61" />
                                <rect x="9.78271" y="3.9491" width="128.742" height="1.25291" fill="#B47C57" />
                                <rect x="9.78271" y="35.2717" width="128.742" height="1.25291" fill="#B47C57" />
                                <rect x="138.52" y="5.20349" width="2.40639" height="1.25291" fill="#B47C57" />
                                <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 9.78271 5.20349)" fill="#B47C57" />
                                <rect x="140.929" y="6.45276" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 7.37354 6.45276)" fill="#B47C57" />
                                <rect x="142.131" y="7.70728" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 6.17432 7.70728)" fill="#B47C57" />
                                <rect x="143.335" y="8.96179" width="1.20319" height="22.5525" fill="#B47C57" />
                                <rect width="1.20319" height="22.5525" transform="matrix(-1 0 0 1 4.96973 8.96179)" fill="#B47C57" />
                                <rect x="142.131" y="31.5109" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 6.17432 31.5109)" fill="#B47C57" />
                                <rect x="140.929" y="32.7654" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 7.37354 32.7654)" fill="#B47C57" />
                                <rect x="138.52" y="34.0199" width="2.40639" height="1.25291" fill="#B47C57" />
                                <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 9.78271 34.0199)" fill="#B47C57" />
                                <rect x="9.78271" y="5.20349" width="128.742" height="30.0699" fill="#FCBD80" />
                                <rect x="138.52" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                                <rect x="140.929" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                <rect x="142.131" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                <rect x="4.96973" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                <rect x="6.17432" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                <rect x="7.37354" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                            </svg>
                            <span className="absolute font-bold text-[10px] font-ibm flex text-center text-[#000]">
                                Speed
                                <img className="w-4 ml-1 mr-1" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                {typeof ninja?.level === 'number' ? user.appConfig.data.LEVEL_NINJAS[ninja.class][ninja.level].farm_speed_hour : 0}
                                /h
                            </span>
                        </div>
                        {is_farming && (
                            <div className="flex items-center justify-center px-6 py-3">
                                <svg width="130" height="41" viewBox="0 0 144 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="60.0278" y="0.574097" width="77.657" height="1.5214" fill="#451B0B" />
                                    <rect x="60.0278" y="38.6074" width="77.657" height="1.5214" fill="#451B0B" />
                                    <rect x="137.687" y="2.09814" width="2.52572" height="1.5214" fill="#451B0B" />
                                    <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 60.6172 2.09741)" fill="#451B0B" />
                                    <rect x="140.215" y="3.6189" width="1.26286" height="1.5214" fill="#451B0B" />
                                    <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 58.0942 3.61816)" fill="#451B0B" />
                                    <rect x="141.474" y="5.13684" width="1.26286" height="1.5214" fill="#451B0B" />
                                    <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 56.835 5.13611)" fill="#451B0B" />
                                    <rect x="142.737" y="6.66028" width="1.26286" height="27.3851" fill="#451B0B" />
                                    <rect width="1.26286" height="27.3851" transform="matrix(-1 0 0 1 55.5669 6.65942)" fill="#451B0B" />
                                    <rect x="141.474" y="34.0454" width="1.26286" height="1.5214" fill="#451B0B" />
                                    <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 56.835 34.0447)" fill="#451B0B" />
                                    <rect x="140.215" y="35.5687" width="1.26286" height="1.5214" fill="#451B0B" />
                                    <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 58.0942 35.568)" fill="#451B0B" />
                                    <rect x="137.687" y="37.0868" width="2.52572" height="1.5214" fill="#451B0B" />
                                    <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 60.6172 37.0861)" fill="#451B0B" />
                                    <rect x="60.0278" y="2.09814" width="77.657" height="36.5135" fill="#BC8C61" />
                                    <rect x="137.687" y="3.6189" width="2.52572" height="33.4707" fill="#BC8C61" />
                                    <rect x="140.215" y="5.13684" width="1.26286" height="30.4279" fill="#BC8C61" />
                                    <rect x="141.474" y="6.66028" width="1.26286" height="27.3851" fill="#BC8C61" />
                                    <rect x="55.5669" y="6.65942" width="1.26286" height="27.3851" fill="#BC8C61" />
                                    <rect x="56.835" y="5.13611" width="1.26286" height="30.4279" fill="#BC8C61" />
                                    <rect x="58.0942" y="3.61816" width="2.52572" height="33.4707" fill="#BC8C61" />
                                    <rect x="63.6333" y="3.94922" width="70.7448" height="1.25291" fill="#B47C57" />
                                    <rect x="63.2671" y="35.2717" width="71.111" height="1.25291" fill="#B47C57" />
                                    <rect x="134.374" y="5.20349" width="2.40639" height="1.25291" fill="#B47C57" />
                                    <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 63.6362 5.20349)" fill="#B47C57" />
                                    <rect x="136.783" y="6.45276" width="1.20319" height="1.25291" fill="#B47C57" />
                                    <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 61.2271 6.45276)" fill="#B47C57" />
                                    <rect x="137.985" y="7.70728" width="1.20319" height="1.25291" fill="#B47C57" />
                                    <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 60.0278 7.70728)" fill="#B47C57" />
                                    <rect x="139.188" y="8.96179" width="1.20319" height="22.5525" fill="#B47C57" />
                                    <rect width="1.20319" height="22.5525" transform="matrix(-1 0 0 1 58.8232 8.96179)" fill="#B47C57" />
                                    <rect x="137.985" y="31.511" width="1.20319" height="1.25291" fill="#B47C57" />
                                    <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 60.0278 31.511)" fill="#B47C57" />
                                    <rect x="136.783" y="32.7654" width="1.20319" height="1.25291" fill="#B47C57" />
                                    <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 61.2271 32.7654)" fill="#B47C57" />
                                    <rect x="134.374" y="34.0199" width="2.40639" height="1.25291" fill="#B47C57" />
                                    <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 63.6362 34.0199)" fill="#B47C57" />
                                    <rect x="63.2671" y="5.20349" width="71.111" height="30.0699" fill="#FCBD80" />
                                    <rect x="134.374" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                                    <rect x="136.783" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                    <rect x="137.985" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                    <rect x="58.8232" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                    <rect x="60.0278" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                    <rect x="61.2271" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                                </svg>
                                <span className="absolute font-bold text-[10px] font-ibm flex text-center ml-12 text-[#000]">Training...</span>
                            </div>
                        )}
                    </div>
                    <div className='absolute flex justify-end h-[525px] w-[375px] xxs:w-[430px] xs:w-[500px]'>
                        {ninja && <div className="flex items-center justify-center px-6 py-3">
                            <svg width="130" height="41" viewBox="0 0 144 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="60.0278" y="0.574097" width="77.657" height="1.5214" fill="#451B0B" />
                                <rect x="60.0278" y="38.6074" width="77.657" height="1.5214" fill="#451B0B" />
                                <rect x="137.687" y="2.09814" width="2.52572" height="1.5214" fill="#451B0B" />
                                <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 60.6172 2.09741)" fill="#451B0B" />
                                <rect x="140.215" y="3.6189" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 58.0942 3.61816)" fill="#451B0B" />
                                <rect x="141.474" y="5.13684" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 56.835 5.13611)" fill="#451B0B" />
                                <rect x="142.737" y="6.66028" width="1.26286" height="27.3851" fill="#451B0B" />
                                <rect width="1.26286" height="27.3851" transform="matrix(-1 0 0 1 55.5669 6.65942)" fill="#451B0B" />
                                <rect x="141.474" y="34.0454" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 56.835 34.0447)" fill="#451B0B" />
                                <rect x="140.215" y="35.5687" width="1.26286" height="1.5214" fill="#451B0B" />
                                <rect width="1.26286" height="1.5214" transform="matrix(-1 0 0 1 58.0942 35.568)" fill="#451B0B" />
                                <rect x="137.687" y="37.0868" width="2.52572" height="1.5214" fill="#451B0B" />
                                <rect width="2.52572" height="1.5214" transform="matrix(-1 0 0 1 60.6172 37.0861)" fill="#451B0B" />
                                <rect x="60.0278" y="2.09814" width="77.657" height="36.5135" fill="#BC8C61" />
                                <rect x="137.687" y="3.6189" width="2.52572" height="33.4707" fill="#BC8C61" />
                                <rect x="140.215" y="5.13684" width="1.26286" height="30.4279" fill="#BC8C61" />
                                <rect x="141.474" y="6.66028" width="1.26286" height="27.3851" fill="#BC8C61" />
                                <rect x="55.5669" y="6.65942" width="1.26286" height="27.3851" fill="#BC8C61" />
                                <rect x="56.835" y="5.13611" width="1.26286" height="30.4279" fill="#BC8C61" />
                                <rect x="58.0942" y="3.61816" width="2.52572" height="33.4707" fill="#BC8C61" />
                                <rect x="63.6333" y="3.94922" width="70.7448" height="1.25291" fill="#B47C57" />
                                <rect x="63.2671" y="35.2717" width="71.111" height="1.25291" fill="#B47C57" />
                                <rect x="134.374" y="5.20349" width="2.40639" height="1.25291" fill="#B47C57" />
                                <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 63.6362 5.20349)" fill="#B47C57" />
                                <rect x="136.783" y="6.45276" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 61.2271 6.45276)" fill="#B47C57" />
                                <rect x="137.985" y="7.70728" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 60.0278 7.70728)" fill="#B47C57" />
                                <rect x="139.188" y="8.96179" width="1.20319" height="22.5525" fill="#B47C57" />
                                <rect width="1.20319" height="22.5525" transform="matrix(-1 0 0 1 58.8232 8.96179)" fill="#B47C57" />
                                <rect x="137.985" y="31.511" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 60.0278 31.511)" fill="#B47C57" />
                                <rect x="136.783" y="32.7654" width="1.20319" height="1.25291" fill="#B47C57" />
                                <rect width="1.20319" height="1.25291" transform="matrix(-1 0 0 1 61.2271 32.7654)" fill="#B47C57" />
                                <rect x="134.374" y="34.0199" width="2.40639" height="1.25291" fill="#B47C57" />
                                <rect width="2.40639" height="1.25291" transform="matrix(-1 0 0 1 63.6362 34.0199)" fill="#B47C57" />
                                <rect x="63.2671" y="5.20349" width="71.111" height="30.0699" fill="#FCBD80" />
                                <rect x="134.374" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                                <rect x="136.783" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                <rect x="137.985" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                <rect x="58.8232" y="8.96179" width="1.20319" height="22.5525" fill="#FCBD80" />
                                <rect x="60.0278" y="7.70728" width="1.20319" height="25.0583" fill="#FCBD80" />
                                <rect x="61.2271" y="6.45276" width="2.40639" height="27.5641" fill="#FCBD80" />
                            </svg>
                            <span className="absolute font-bold text-[10px] font-ibm flex text-center ml-12 text-[#000]">APR: {user.appConfig.data.LEVEL_NINJAS[ninja.class][ninja.level].APR}%</span>
                        </div>}
                    </div>
                    <div className="flex justify-center w-full max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px]">
                        {is_farming ? (
                            ninja && <img className="m-auto w-[365px] xxs:w-[420px] xs:w-[500px] h-[300px] rounded-xl" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/${ninja.class}-training.gif`} />
                        ) : (
                            (!showBag && ninja && ninja.level < 5) ? (
                                <div className="relative w-[365px] xxs:w-[420px] xs:w-[500px] h-[300px] rounded-xl bg-gray-600 text-white font-bold text-lg p-6 mx-0 shadow-lg overflow-hidden">
                                    <img className="absolute inset-0 w-[365px] xxs:w-[420px] xs:w-[500px] h-[300px] h-full opacity-30 rounded-xl" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/bg.gif" alt="" />
                                    <div className="relative z-10">
                                        <div className="flex justify-center items-center pt-20">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 512 512" className="h-6 w-6"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" /></svg>
                                        </div>
                                        <p className="text-center mt-4">You need a Ninja at level 5+ to start training.</p>
                                    </div>
                                </div>
                            ) : <img className="m-auto w-[365px] xxs:w-[420px] xs:w-[500px] h-[300px] rounded-xl" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/bg.gif" />
                        )}
                    </div>
                </div>
                <div className="flex w-full max-w-[500px] px-2 py-4">
                    <div className="w-[220px] h-[200px] rounded-xl relative bg-no-repeat bg-center bg-cover shadow-[0_0_0_2px_#451B0B] ring-4 ring-[#BC8C61] ring-inset">
                        <div className='absolute w-full h-full rounded-2xl border-solid border-4 border-[#BC8C61]'>
                            {ninja && <img className="absolute w-full h-full object-cover rounded-xl" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/bg-${ninja.class}.png`} alt="" />}
                            <div className="flex items-center">
                                {ninja && (
                                    <span className={`inline-flex items-center rounded-md ${addModal ? '' : 'bg-[#E7E5E4]'} bg-opacity-80 m-2 px-2 text-[10px] font-medium text-black z-10`} style={{ fontWeight: 700 }}>lv {ninja.level}</span>
                                )}
                            </div>
                            {ninja && (
                                <div className="w-full h-full flex flex-col">
                                    <MainPanel ninja_class={ninja.class} />
                                    <div className="absolute justify-center bottom-0 left-0 w-full">
                                        <div className="bg-[#0f0f0fa1] rounded-b-md w-full text-center py-1">
                                            {new Date(ninja.mana).getTime() < Date.now() ? <span className="text-sm font-bold text-[#FF5858]">OUT OF MANA</span> : <span className="text-sm font-bold text-[#fff]">HEALTHY</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col w-[200px] xxs:w-[230px] xs:w-[260px] px-2 xxs:px-3 xs:px-6">
                        {ninja && <label className='text-3xl m-0' style={{ fontWeight: 700 }}>
                            {ninja.level < 4 && 'Ninja'}
                            {(ninja.level > 4 && ninja.level <= 16) && 'Guardian'}
                            {(ninja.level > 16 && ninja.level <= 30) && 'Sensei'}
                            {(ninja.level > 30 && ninja.level <= 49) && 'Master'}
                            {ninja.level === 50 && 'Legend'}
                        </label>}
                        {ninja && <span className="text-sm text-[#78716C]" style={{ fontWeight: 400 }} >Class: {ninja.class[0].toUpperCase() + ninja.class.slice(1, ninja.class.length)}</span>}
                        {ninja && (
                            <div className="flex space-x-2 pt-2">
                                {Array.from({ length: Math.ceil((Date.parse(ninja.mana) - Date.now()) / (8 * 60 * 60 * 1000)) }).map((_, index) => (
                                    <svg key={index} width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg" >
                                        <rect x="4.36365" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90912" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="1.45453" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                        <rect x="1.45453" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90912" y="14.5459" width="8.72728" height="1.45453" fill="#140C1C" />
                                        <rect x="11.6364" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="13.0909" y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                        <rect x="11.6364" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="10.1818" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="8.72729" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="10.1818" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                        <rect x="4.36365" width="5.81818" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90912" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                        <rect x="4.36365" y="1.4541" width="1.45455" height="1.45453" fill="#D27D2C" />
                                        <rect x="5.81818" y="1.4541" width="2.90909" height="1.45453" fill="#854C30" />
                                        <rect x="8.72729" y="1.4541" width="1.45455" height="1.45453" fill="#442434" />
                                        <rect x="4.36365" y="2.90918" width="2.90909" height="1.45453" fill="#854C30" />
                                        <rect x="7.27271" y="2.90918" width="2.90909" height="1.45453" fill="#442434" />
                                        <rect x="5.81818" y="4.36426" width="2.90909" height="1.45453" fill="#757161" />
                                        <rect x="4.36365" y="5.81836" width="4.36364" height="1.45453" fill="#757161" />
                                        <rect x="8.72723" y="5.81836" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                        <rect x="2.90912" y="7.27246" width="1.45455" height="1.45453" fill="#757161" />
                                        <rect x="5.81818" y="7.27246" width="4.36364" height="1.45453" fill="#757161" />
                                        <rect x="10.1818" y="7.27246" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                        <rect x="4.36365" y="7.27246" width="1.45455" height="2.90906" fill="#DEEED6" />
                                        <rect x="2.90912" y="8.72754" width="1.45455" height="1.45453" fill="#DEEED6" />
                                        <rect x="1.45453" y="8.72754" width="1.45455" height="4.36359" fill="#757161" />
                                        <rect x="2.90912" y="10.1816" width="1.45455" height="2.90906" fill="#D04648" />
                                        <rect x="4.36365" y="10.1816" width="7.27273" height="1.45453" fill="#D04648" />
                                        <rect x="5.81818" y="8.72754" width="4.36364" height="1.45453" fill="#D04648" />
                                        <rect x="10.1818" y="8.72754" width="1.45455" height="1.45453" fill="#442434" />
                                        <rect x="11.6364" y="8.72754" width="1.45455" height="2.90906" fill="#757161" />
                                        <rect x="11.6364" y="11.6367" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                        <rect x="10.1818" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                        <rect x="8.72729" y="11.6367" width="1.45455" height="1.45453" fill="#D04648" />
                                        <rect x="7.27271" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                        <rect x="5.81818" y="11.6367" width="1.45455" height="1.45453" fill="#D04648" />
                                        <rect x="4.36365" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                        <rect x="2.90912" y="13.0908" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                        <rect x="10.1818" y="13.0908" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                        <rect x="4.36365" y="13.0908" width="5.81818" height="1.45453" fill="#757161" />
                                    </svg>
                                ))}
                                {user.appConfig.data.MANA_CLASSES[ninja.class] && Array.from({ length: Math.ceil((Date.parse(ninja.mana) - Date.now()) / (8 * 60 * 60 * 1000)) > 0 ? user.appConfig.data.MANA_CLASSES[ninja.class] - Math.ceil((Date.parse(ninja.mana) - Date.now()) / (8 * 60 * 60 * 1000)) : user.appConfig.data.MANA_CLASSES[ninja.class] }).map((_, index) => (
                                    <svg key={index} width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="4.36365" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90906" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="1.45459" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                        <rect x="1.45459" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90906" y="14.5459" width="8.72728" height="1.45453" fill="#140C1C" />
                                        <rect x="11.6364" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="13.0909" y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                        <rect x="11.6364" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="10.1818" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="8.72729" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                        <rect x="10.1818" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                        <rect x="4.36365" width="5.81818" height="1.45453" fill="#140C1C" />
                                        <rect x="2.90906" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                        <rect x="4.36365" y="1.4541" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="5.81812" y="1.4541" width="2.90909" height="1.45453" fill="#F6F6F6" />
                                        <rect x="8.72729" y="1.4541" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="4.36365" y="2.90918" width="2.90909" height="1.45453" fill="#F6F6F6" />
                                        <rect x="7.27271" y="2.90918" width="2.90909" height="1.45453" fill="#F6F6F6" />
                                        <rect x="5.81812" y="4.36426" width="2.90909" height="1.45453" fill="#F6F6F6" />
                                        <rect x="4.36365" y="5.81836" width="4.36364" height="1.45453" fill="#F6F6F6" />
                                        <rect x="8.72729" y="5.81836" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="2.90906" y="7.27246" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="5.81824" y="7.27246" width="4.36364" height="1.45453" fill="#F6F6F6" />
                                        <rect x="10.1819" y="7.27246" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="4.36365" y="7.27246" width="1.45455" height="2.90906" fill="#F6F6F6" />
                                        <rect x="2.90906" y="8.72754" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="1.45459" y="8.72754" width="1.45455" height="4.36359" fill="#F6F6F6" />
                                        <rect x="2.90906" y="10.1816" width="1.45455" height="2.90906" fill="#F6F6F6" />
                                        <rect x="4.36365" y="10.1816" width="7.27273" height="1.45453" fill="#F6F6F6" />
                                        <rect x="5.81824" y="8.72754" width="4.36364" height="1.45453" fill="#F6F6F6" />
                                        <rect x="10.1819" y="8.72754" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="11.6364" y="8.72754" width="1.45455" height="2.90906" fill="#F6F6F6" />
                                        <rect x="11.6364" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="10.1818" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="8.72729" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="7.27271" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="5.81812" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="4.36365" y="11.6367" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="2.90906" y="13.0908" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="10.1818" y="13.0908" width="1.45455" height="1.45453" fill="#F6F6F6" />
                                        <rect x="4.36365" y="13.0908" width="5.81818" height="1.45453" fill="#F6F6F6" />
                                    </svg>
                                ))}
                            </div>
                        )}
                        <div className='flex justify-between space-x-2 pt-6'>
                            <button
                                className={`btn outline-none shadow-none rounded-full h-8 w-16 xxs:w-28 xs:w-28 border-[#000]`}
                                disabled={!ninja}
                                onClick={() => {
                                    dispatch(setShowHeader(false));
                                    setShowBag(true);
                                }}
                            >
                                <Banana />
                                <span className='text-xs ml-1'>Feed</span>
                            </button>
                            <button
                                className='btn outline-none shadow-none rounded-full h-8 w-28 xxs:w-28 xs:w-28 border-[#000]'
                                disabled={!!(!ninja || ninja.level < 5 || is_farming)}
                                onClick={() => {
                                    const id = ninja?._id;

                                    if (!id) return;
                                    axiosApi
                                        .post(`${import.meta.env.VITE_API_URL}/api/games/farm`, { id: id })
                                        .then((response) => {
                                            toast.success('Train successfully!', { duration: 3000, className: 'font-ibm text-xs' });
                                            setNinja((prev: any) => ({ ...prev, farm_at: response.data.farm_at }));
                                            setNinjas((prev) => prev.map((v) => (v._id === id ? { ...v, farm_at: response.data.farm_at } : v)));
                                        })
                                        .catch((error) => {
                                            if (axios.isAxiosError(error) && error.response) {
                                                if (error.response.status === 403) {
                                                    signOut(reloadMe);
                                                } else if (error.response.status === 404 && error.response.data.status === 'NINJA_RUNS_OUT_OF_MANA') {
                                                    toast.error('Ninja is out of energy!', { duration: 3000, className: 'font-ibm text-xs' });
                                                }
                                            }
                                        });
                                }}
                            >
                                <Sword />
                                <span className='text-xs ml-1'>{is_farming ? 'Training' : 'Train'}</span>
                            </button>
                        </div>
                        <div className='flex py-5'>
                            <button
                                className='btn bg-[#000] outline-none shadow-none rounded-full h-10 w-full border-[#000]'
                                disabled={!ninja || ninja.level === 50}
                                onClick={() => showDialog({ type: 'UPGRADE_NINJA' })}
                            >
                                <LevelUp />
                                <span className='text-xs ml-1 text-white'>Level Up</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full w-full h-full max-w-[375px] xxs:max-w-[420px] xs:max-w-[500px] max-h-[150px] overflow-hidden">
                    <div className="flex flex-col h-full max-h-[200px] overflow-auto scrollbar-hide">
                        <div className="grid grid-cols-4 gap-4 px-4 py-1">
                            {ninjas.map((value: UserNinja, index: number) => (
                                <div
                                    className={`${value._id === ninja?._id && 'outline outline-[1px] outline-cyan-500'} panel max-h-[110px] p-2 bg-[#F5f5f4] rounded-xl transition-all duration-100 hover:cursor-pointer`}
                                    key={index}
                                    onClick={() => setNinja(value)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`${addModal ? '' : 'bg-[#E7E5E4]'} inline-flex items-center rounded-md bg-opacity-80 px-2 text-[10px] font-medium text-black z-10`} style={{ fontWeight: 700 }}>lv {value.level}</span>
                                    </div>
                                    <div className="w-full !h-[50px] xxs:!h-[70px] xs:!h-[200px] flex flex-col items-center">
                                        <OptionPanel ninja_class={value.class} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {params && (
                <Transition appear show={addModal} as={Fragment}>
                    <Dialog
                        as="div"
                        open={addModal}
                        onClose={() => {
                            setModal(false);
                            setActiveModal(false);
                        }}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-[black]/60" />
                        </Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto z-50">
                            <div className="flex min-h-full items-center justify-center px-4 py-8">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className={`panel w-80 max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black`}>
                                        {params.type === 'UPGRADE_NINJA' && (
                                            <>
                                                <div className="flex flex-col border-b border-white-light font-ibm">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModal(false);
                                                            setActiveModal(false);
                                                        }}
                                                        className="absolute top-4 text-gray-400 outline-none hover:text-gray-800 ltr:right-4 rtl:left-4"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                    <div className="bg-[#fbfbfb] py-4 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5">
                                                        <div className="flex items-center text-xs">
                                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512" className="mr-1">
                                                                <path d="M64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16L64 80zM0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm224 64c6.7 0 13 2.8 17.6 7.7l104 112c6.5 7 8.2 17.2 4.4 25.9s-12.5 14.4-22 14.4l-208 0c-9.5 0-18.2-5.7-22-14.4s-2.1-18.9 4.4-25.9l104-112c4.5-4.9 10.9-7.7 17.6-7.7z" />
                                                            </svg>
                                                            Level up your Ninja
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-80 h-auto bg-white p-4 flex flex-col items-center">
                                                    <div className="flex justify-center">
                                                        <div className="mt-5 flex flex-col w-[100px] h-[100px] bg-[#f5f5f4] rounded-md">
                                                            <div className="flex">
                                                                {ninja && (
                                                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">
                                                                        LV {ninja.level}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {ninja && <UpgradePanel ninja_class={ninja.class} />}
                                                        </div>
                                                        <div className="p-5 self-center mt-4">
                                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
                                                                <path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="mt-5 flex flex-col w-[100px] h-[100px] bg-[#f5f5f4] rounded-md">
                                                            <div className="flex">
                                                                {ninja && (
                                                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">
                                                                        LV {ninja.level + 1}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {ninja && <UpgradePanel ninja_class={ninja.class} />}
                                                        </div>
                                                    </div>

                                                    <div className="flex w-80 px-4 mt-5 mb-1 items-center">
                                                        <span className="font-ibm">Class</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <span className="font-ibm ml-1 truncate">{ninja && ninja.class[0].toUpperCase() + ninja.class.slice(1, ninja.class.length)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-80 px-4 mb-1 items-center">
                                                        <span className="font-ibm">Cost</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">
                                                                    {ninja && formatPriceNumber(Number(user.appConfig.data.LEVEL_NINJAS[ninja.class][ninja.level + 1]?.cost))} ELEM
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-80 px-4 mb-2 items-center">
                                                        <span className="font-ibm">Fee</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">
                                                                    0.0015
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-72 flex justify-center">
                                                        <button
                                                            className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                            disabled={activeModal}
                                                            onClick={() => {
                                                                const id = ninja?._id;

                                                                if (!id) return;

                                                                setActiveModal(true);
                                                                axiosApi
                                                                    .post(`${import.meta.env.VITE_API_URL}/api/games/upgrade`, { id: id, currentLevel: ninja.level })
                                                                    .then((response) => {
                                                                        toast.success(
                                                                            `You have successfully upgraded your ${ninja.class[0].toUpperCase() + ninja.class.slice(1, ninja.class.length)} to level ${ninja.level + 1
                                                                            }.`,
                                                                            {
                                                                                duration: 3000,
                                                                                className: 'font-ibm text-xs',
                                                                            }
                                                                        );
                                                                        setWallet((prev) => ({ ...prev, ELEM: response.data.ELEM }));
                                                                        setNinja((prev: any) => ({
                                                                            ...prev,
                                                                            balance: (prev.balance || 0) + response.data.balance,
                                                                            farm_at: null,
                                                                            level: prev.level + 1,
                                                                        }));
                                                                        setNinjas((prev: any) =>
                                                                            prev.map((v: any) =>
                                                                                v._id === id ? { ...v, balance: (v.balance || 0) + response.data.balance, farm_at: null, level: v.level + 1 } : v
                                                                            )
                                                                        );
                                                                    })
                                                                    .catch((error) => {
                                                                        if (axios.isAxiosError(error) && error.response) {
                                                                            if (error.response.status === 403) {
                                                                                signOut(reloadMe);
                                                                            } else if (error.response.status === 404) {
                                                                                if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                                                    toast.error(`You don't have enough ELEM.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                                                    toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                                                    toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                            } else if (error.response.status === 500) {
                                                                                toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                            };
                                                                        }
                                                                    })
                                                                    .finally(() => {
                                                                        setModal(false);
                                                                        setActiveModal(false);
                                                                    });
                                                            }}
                                                        >
                                                            {activeModal && (
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
                                                            )}
                                                            Level up for{' '}
                                                            <div className="flex items-center ml-1">
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">
                                                                    {ninja && formatPriceNumber(Number(user.appConfig.data.LEVEL_NINJAS[ninja.class][ninja.level + 1]?.cost))}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            )}
            <Toaster />
        </>
    );
};

export default Index;
