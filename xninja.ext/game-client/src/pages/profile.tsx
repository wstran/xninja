import { Dispatch, Fragment, SetStateAction, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { signOut, useMeQuery } from '../hooks/useMeQuery';
import ProfileInvite from './components/profile_invite';
import { FirstPage, SecondPage, ThirdPage, FourthPage, Verify2FA } from './components/2fa';
import ExportWallet from './components/export_wallet';
import CopyToClipboard from 'react-copy-to-clipboard';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowUpTrayIcon, BanknotesIcon } from "@heroicons/react/20/solid";
import { useDispatch } from 'react-redux';
import { setShowHeader } from '../store/themeConfigSlice';
import { formatPriceNumber, roundDown } from './libs/custom';
import { ethers } from 'ethers';
import axiosApi from './libs/axios';
import Deposit from './components/deposit';
import Withdraw from './components/withdraw';
import { Dialog, Transition } from '@headlessui/react';

function isNumeric(str: string) {
    if (typeof str !== "string") return false
    return !isNaN(parseFloat(str)) && !isNaN(Number(str));
};

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

function ConvertClaimButton({ coinlist, setCoinlist, convertOption, convertData, setConvertOption, setConvertData, reloadMe }: {
    coinlist: {
        id: number;
        token: string;
        balance: string;
        isLoading: boolean;
        icon: string;
        iconBackground: string;
    }[];
    setCoinlist: Dispatch<SetStateAction<{
        id: number;
        token: string;
        balance: string;
        isLoading: boolean;
        icon: string;
        iconBackground: string;
    }[]>>
    convertOption: { reverse: boolean, active: boolean, claim_active: boolean };
    convertData: { claims: { amount: string; created_at: Date }[], expected_claim_at: string; can_claim_convert: boolean };
    setConvertOption: Dispatch<SetStateAction<{
        reverse: boolean;
        active: boolean;
        claim_active: boolean;
    }>>
    setConvertData: Dispatch<SetStateAction<{
        amount: string;
        historys: {
            amount: number;
            created_at: Date;
        }[];
        reverse_historys: {
            amount: number;
            created_at: Date;
        }[];
        claims: {
            amount: string;
            created_at: Date;
        }[];
        expected_claim_at: string;
        can_claim_convert: boolean;
    }>>
    reloadMe: () => void;
}) {
    const [convertClaim, setConvertClaim] = useState<boolean>(false);

    useEffect(() => {
        if (!convertData.can_claim_convert && convertData.expected_claim_at) {
            setConvertClaim(convertData.claims.findIndex(() => {
                const convertDate = new Date(convertData.expected_claim_at);

                return new Date().getTime() > convertDate.getTime();
            }) === -1)

            const intervalId = setInterval(() => {
                setConvertClaim(convertData.claims.findIndex(() => {
                    const convertDate = new Date(convertData.expected_claim_at);

                    return new Date().getTime() > convertDate.getTime();
                }) === -1)
            }, 1000);

            return () => clearInterval(intervalId);
        } else if (convertData.can_claim_convert) {
            setConvertClaim(false);
        };
    }, [convertData]);

    return <button
        onClick={() => {
            setConvertOption((prev) => ({ ...prev, claim_active: true }));

            axiosApi
                .post(`${import.meta.env.VITE_API_URL}/api/blockchain/claim_convert`)
                .then((response) => {
                    toast.success('You have successfully claimed!', { duration: 3000, className: 'font-ibm text-xs' });
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

                    setConvertData((prev: any) => ({ ...prev, amount: 0, claims: response.data.claims, can_claim_convert: response.data.can_claim_convert, expected_claim_at: response.data.expected_claim_at }));
                })
                .catch((error) => {
                    console.error(error);
                    if (error.response.status === 403) {
                        signOut(reloadMe);
                    } else if (error.response.status === 404) {
                        if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                            toast.error(`You don't have enough.`, { duration: 3000, className: 'font-ibm text-xs' });
                        };
                        if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                            toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                        };
                        if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                            toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                        };
                        if (error.response.data.status === 'CLAIM_DATE_HAS_NOT_YET_ARRIVED') {
                            toast.error(`The expected claim date has not yet arrived!`, { duration: 3000, className: 'font-ibm text-xs' });
                        };
                    } else if (error.response.status === 500) {
                        toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                    };
                })
                .finally(() => {
                    setConvertOption((prev) => ({ ...prev, claim_active: false }));
                });
        }}
        disabled={convertOption.claim_active || convertClaim}
        className="btn bg-gray-700 text-white text-xs px-4 py-[5px] rounded-full hover:bg-gray-500 active:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-[0.8] disabled:hover:bg-gray-700 disabled:active:bg-gray-700 focus:outline-none"
    >
        {convertOption.claim_active && (
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
}

const Index = ({ }: { setRoute: (route: '/' | '/quest' | '/market' | '/profile') => void }) => {
    const { data: user, coinlist: coins, reload: reloadMe, loading } = useMeQuery('username profile_image_url two_factor_enabled addresses invite_code boosts');
    const [coinlist, setCoinlist] = useState(coins);
    const [tabs, setTabs] = useState<string>('tokens');
    const [currentPage, setCurrentPage] = useState<string>('');
    const [isCoppy, setIsCoppy] = useState<boolean>(false);
    const [verifyOtp, setVerifyOtp] = useState('');
    const dispatch = useDispatch();

    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const ensureHttpsUrl = (url: string) => {
        if (!url) return url;
        return url.replace(/^http:/, 'https:');
    };

    const [borrowOption, setBorrowOption] = useState({ borrow: true, borrowActive: false, repay: false, repayActive: false });
    const [convertOption, setConvertOption] = useState({ reverse: true, active: false, claim_active: false });

    const [borrowData, setBorrowData] = useState<{ amount: string; borrowAmount: number; INJ_price: number; XNJ_price: number; borrow_percent: number; historys: { amount: string; loanAmount: string; created_at: Date }[] }>({ amount: '', borrowAmount: 0, INJ_price: 0, XNJ_price: 0.05, borrow_percent: 85, historys: [] });
    const [repayData, setRepayData] = useState<{ amount: string; total_inj_staked: string; total_xnj_received: string; historys: { amount: string; repayAmount: string; created_at: Date }[] }>({ amount: '', total_xnj_received: '0', total_inj_staked: '0', historys: [] });
    const [convertData, setConvertData] = useState<{ amount: string; historys: { amount: number; created_at: Date }[]; reverse_historys: { amount: number; created_at: Date }[]; claims: { amount: string; created_at: Date }[], expected_claim_at: string; can_claim_convert: boolean }>({ amount: '', historys: [], reverse_historys: [], claims: [], expected_claim_at: '', can_claim_convert: false });

    useEffect(() => {
        if (!currentPage) {
            toast.remove();
        }
    }, [currentPage]);

    useLayoutEffect(() => {
        dispatch(setShowHeader(true));
    }, []);

    useLayoutEffect(() => {
        setCoinlist(coins);
    }, [coins]);

    useLayoutEffect(() => {
        if (user?.appConfig.convert_elem_to_xnj_state === 'disable') {
            setConvertOption(prev => ({ ...prev, reverse: true }));
        } else if (user?.appConfig.convert_xnj_to_elem_state === 'disable') {
            setConvertOption(prev => ({ ...prev, reverse: false }));
        };
    }, [user]);

    useLayoutEffect(() => {
        if (user?.addresses?.injectiveAddress) {
            user.appConfig.borrow_state === 'disable' && setBorrowOption(prev => ({ ...prev, borrow: false, repay: true }));
            setBorrowData(prev => ({ ...prev, XNJ_price: user.appConfig.XNJ_price, borrow_percent: user.appConfig.borrow_percent }));

            axiosApi
                .get(`${import.meta.env.VITE_API_URL}/api/blockchain/get-convert`)
                .then((response) => {
                    const historys = response.data.historys;
                    const reverse_historys = response.data.reverse_historys;
                    const claims = response.data.claims;
                    const expected_claim_at = response.data.expected_claim_at;
                    const can_claim_convert = response.data.can_claim_convert;

                    setConvertData((prev: any) => ({ ...prev, historys, reverse_historys, claims, can_claim_convert, expected_claim_at }));
                })
                .catch((error) => {
                    console.error('Error fetching converts', error);
                    error.response.status === 403 && signOut(reloadMe);
                });

            axiosApi
                .get(`${import.meta.env.VITE_API_URL}/api/blockchain/get-borrow`)
                .then((response) => {
                    setBorrowData((prev: any) => ({ ...prev, INJ_price: response.data.inj_price, historys: response.data.historys }));
                })
                .catch((error) => {
                    console.error('Error fetching borrows', error);
                    error.response.status === 403 && signOut(reloadMe);
                });

            axiosApi
                .get(`${import.meta.env.VITE_API_URL}/api/blockchain/get-repay`)
                .then((response) => {
                    setRepayData((prev: any) => ({ ...prev, historys: response.data.historys, total_inj_staked: response.data.total_inj_staked, total_xnj_received: response.data.total_xnj_received }));
                })
                .catch((error) => {
                    console.error('Error fetching repays', error);
                    error.response.status === 403 && signOut(reloadMe);
                });
        }
    }, [user?.addresses?.injectiveAddress]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    const [addModal, setModal] = useState<any>(false);
    const [params, setParams] = useState<any>({});
    const [activeModal, setActiveModal] = useState<boolean>(false);

    const showDialog = (data: any) => {
        setParams(data);
        setModal(true);
    };

    const convertToken = useMemo(() => {
        const token = coinlist.find((i) => i.token.toLowerCase() === (convertOption.reverse ? 'xnj' : 'elem'));

        return token;
    }, [coinlist, convertOption.reverse]);

    if (loading || !user) return null;

    const injectiveAddress = user?.addresses?.injectiveAddress;

    if (currentPage === "deposit") return <Deposit injectiveAddress={injectiveAddress} coinlist={coinlist} setCoinlist={setCoinlist} setPage={setCurrentPage} />;

    if (currentPage === "withdraw") return <Withdraw injectiveAddress={injectiveAddress} coinlist={coinlist} setCoinlist={setCoinlist} setPage={setCurrentPage} />;

    if (currentPage === 'invite_page') return <ProfileInvite backToProfile={() => setCurrentPage('')} user={user} reloadMe={reloadMe} />;

    if (currentPage === '2fa_page_1') return <FirstPage setPage={setCurrentPage} />;

    if (currentPage === '2fa_page_2') return <SecondPage reloadMe={reloadMe} setPage={setCurrentPage} />;

    if (currentPage === '2fa_page_3') return <ThirdPage reloadMe={reloadMe} setPage={setCurrentPage} />;

    if (currentPage === '2fa_page_4') return <FourthPage reloadMe={reloadMe} setPage={setCurrentPage} />;

    if (currentPage === '2fa_page_verify')
        return (
            <Verify2FA
                reloadMe={reloadMe}
                onVerify={(otp) => {
                    setVerifyOtp(otp);
                    setCurrentPage(otp ? 'export_wallet' : '');
                }}
            />
        );

    if (currentPage === 'export_wallet') return <ExportWallet totpCode={verifyOtp} reloadMe={reloadMe} setPage={setCurrentPage} />;

    return (
        <>
            <div className="p-2 flex items-center overflow-y-auto border-b border-white-light w-full max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                <div className="flex w-full justify-end">
                    <button
                        className="text-gray-900 border bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold px-3 py-2 text-center inline-flex items-center"
                        onClick={() => setCurrentPage('invite_page')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 12H7V13H13V12H14V11H15V5H14V4H13V3H7V4H6V5H5V11H6V12ZM7 7H8V6H9V5H11V6H12V7H13V9H12V10H11V11H9V10H8V9H7V7Z" fill="black" />
                            <path d="M17 15H16V14H4V15H3V16H2V21H4V18H5V17H6V16H14V17H15V18H16V19V20V21H18V16H17V15Z" fill="black" />
                            <path d="M20 7V6V5H18V7H16V9H18V11H20V9H22V7H20Z" fill="black" />
                        </svg>
                        Invite Friend
                    </button>
                </div>
            </div>
            <div className="mb-2 mt-5 flex items-center pb-2">
                <div className="flex w-full flex-col items-center">
                    <img className="relative h-12 w-12 rounded-full object-cover ring-2 ring-white" src={ensureHttpsUrl(user.profile_image_url)} alt="img" />
                    <span className="text-md mt-2 font-bold">@{user.username}</span>
                    {injectiveAddress && (
                        <div className="flex items-center">
                            <span className="text-sm font-bold">
                                {injectiveAddress.slice(0, 6)}...{injectiveAddress.slice(injectiveAddress.length - 4, injectiveAddress.length)}
                            </span>
                            <CopyToClipboard
                                text={injectiveAddress}
                                onCopy={(_, result) => {
                                    if (result) setIsCoppy(true);
                                }}
                            >
                                {isCoppy === true ? (
                                    <svg className="hover:cursor-pointer ml-1 mb-[2px]" fill="#3b3f5c" xmlns="http://www.w3.org/2000/svg" height="15" width="15" viewBox="0 0 448 512">
                                        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                    </svg>
                                ) : (
                                    <svg className="hover:cursor-pointer ml-1 mb-[2px]" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path
                                            opacity="0.5"
                                            d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                    </svg>
                                )}
                            </CopyToClipboard>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-center gap-x-2">
                <button
                    type="button"
                    className="text-gray-900 bg-gray-100 hover:bg-gray-200 border rounded-lg text-xs w-24 px-3 py-1 text-center inline-flex items-center"
                    onClick={() => setCurrentPage("deposit")}
                >
                    <BanknotesIcon className="w-6 h-6 p-1" />
                    Deposit
                </button>
                <button
                    type="button"
                    className="text-gray-900 bg-gray-100 hover:bg-gray-200 border rounded-lg text-xs w-24 px-3 py-1 text-center inline-flex items-center"
                    onClick={() => user.two_factor_enabled
                        ? setCurrentPage('withdraw')
                        : toast('You need to enable the 2FA feature to be able to withdraw', { duration: 3000, className: 'font-ibm text-xs' })}
                >
                    <ArrowUpTrayIcon className="w-6 h-6" />
                    Withdraw
                </button>
            </div>
            <div className="mb-2 flex w-[375px] xxs:w-[430px] xs:w-[500px] flex-col">
                <div>
                    <ul className="mb-5 overflow-y-auto whitespace-nowrap border-b border-white-light text-xs font-semibold">
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('tokens')}
                                className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'tokens' ? '!border-primary text-primary' : ''}`}
                            >
                                Tokens
                            </button>
                        </li>
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('borrow')}
                                className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'borrow' ? '!border-primary text-primary' : ''}`}
                            >
                                Borrow
                            </button>
                        </li>
                        {!(user.appConfig.convert_elem_to_xnj_state === 'disable' && user.appConfig.convert_xnj_to_elem_state === 'disable') && <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('convert')}
                                className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'convert' ? '!border-primary text-primary' : ''}`}
                            >
                                Convert
                            </button>
                        </li>}
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('settings')}
                                className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'settings' ? '!border-primary text-primary' : ''}`}
                            >
                                Settings
                            </button>
                        </li>
                    </ul>
                </div>
                {tabs === 'tokens' && (
                    <>
                        <div className="flex flex-col mx-2">
                            {coinlist.map((event) => (
                                <div key={event.id} className="w-full overflow-hidden rounded-xl px-6 py-2 shadow mb-2 bg-[#f5f5f5] text-black">
                                    <div className="relative">
                                        <div className="relative flex space-x-3 items-center">
                                            <div>
                                                <span className={classNames(event.iconBackground, 'h-12 w-12 rounded-full flex items-center justify-center')}>
                                                    <img src={event.icon} alt="" className="w-[45px] h-[45px]" />
                                                </span>
                                            </div>
                                            <div className="flex min-w-0 flex-1 justify-between space-x-4">
                                                <div className="flex justify-center">
                                                    <div className="flex flex-col">
                                                        <div>
                                                            <p className="text-sm font-black">{event.token}</p>
                                                        </div>
                                                        <div className="whitespace-nowrap text-sm">{event.isLoading ? <span>Loading...</span> : formatPriceNumber(Number(roundDown(event.balance, 2)))}</div>
                                                    </div>
                                                </div>
                                                {event.token === 'INJ' && <div className="whitespace-nowrap text-right text-sm pt-3">{borrowData.INJ_price === 0 ? <span>Loading...</span> : '$' + formatPriceNumber(Number(roundDown(Number(roundDown(borrowData.INJ_price, 2)) * Number(roundDown(event.balance, 2)), 2)))}</div>}
                                                {/* {event.token === 'XNJ' && <div className="whitespace-nowrap text-right text-sm pt-3">{borrowData.XNJ_price === 0 ? <span>Loading...</span> : '$' + formatPriceNumber(Number(roundDown(Number(roundDown(borrowData.XNJ_price, 2)) * Number(roundDown(event.balance, 2)), 2)))}</div> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {tabs === 'borrow' && (
                    <>
                        <div className="panel border mx-2">
                            <div className="mb-4 text-sm font-semibold">
                                <div className="inline-flex overflow-y-auto whitespace-nowrap rounded-lg shadow-sm" role="group">
                                    <button
                                        disabled={user.appConfig.borrow_state === 'disable'}
                                        onClick={() => {
                                            setBorrowOption(prev => ({ ...prev, borrow: true, repay: false }));
                                            setBorrowData(prev => ({ ...prev, amount: '', borrowAmount: 0 }));
                                        }}
                                        type="button"
                                        className={`inline-flex items-center px-12 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 disabled:hover:bg-white disabled:hover:text-gray-900 ${(user.appConfig.borrow_state !== 'disable' && borrowOption.borrow) ? '!text-blue-700' : 'disabled:hover:cursor-not-allowed'
                                            }`}
                                    >
                                        <svg className="w-3 h-3 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 512">
                                            <path d="M535 41c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l64 64c4.5 4.5 7 10.6 7 17s-2.5 12.5-7 17l-64 64c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l23-23L384 112c-13.3 0-24-10.7-24-24s10.7-24 24-24l174.1 0L535 41zM105 377l-23 23L256 400c13.3 0 24 10.7 24 24s-10.7 24-24 24L81.9 448l23 23c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0L7 441c-4.5-4.5-7-10.6-7-17s2.5-12.5 7-17l64-64c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9zM96 64H337.9c-3.7 7.2-5.9 15.3-5.9 24c0 28.7 23.3 52 52 52l117.4 0c-4 17 .6 35.5 13.8 48.8c20.3 20.3 53.2 20.3 73.5 0L608 169.5V384c0 35.3-28.7 64-64 64H302.1c3.7-7.2 5.9-15.3 5.9-24c0-28.7-23.3-52-52-52l-117.4 0c4-17-.6-35.5-13.8-48.8c-20.3-20.3-53.2-20.3-73.5 0L32 342.5V128c0-35.3 28.7-64 64-64zm64 64H96v64c35.3 0 64-28.7 64-64zM544 320c-35.3 0-64 28.7-64 64h64V320zM320 352a96 96 0 1 0 0-192 96 96 0 1 0 0 192z" />
                                        </svg>
                                        Borrow
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBorrowOption(prev => ({ ...prev, borrow: false, repay: true }));
                                            setBorrowData(prev => ({ ...prev, amount: '', borrowAmount: 0 }));
                                        }}
                                        type="button"
                                        className={`inline-flex items-center px-12 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-blue-700 ${borrowOption.repay ? '!text-blue-700' : ''
                                            }`}
                                    >
                                        <svg className="w-3 h-3 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 576 512">
                                            <path d="M209.4 39.5c-9.1-9.6-24.3-10-33.9-.9L33.8 173.2c-19.9 18.9-19.9 50.7 0 69.6L175.5 377.4c9.6 9.1 24.8 8.7 33.9-.9s8.7-24.8-.9-33.9L66.8 208 208.5 73.4c9.6-9.1 10-24.3 .9-33.9zM352 64c0-12.6-7.4-24.1-19-29.2s-25-3-34.4 5.4l-160 144c-6.7 6.1-10.6 14.7-10.6 23.8s3.9 17.7 10.6 23.8l160 144c9.4 8.5 22.9 10.6 34.4 5.4s19-16.6 19-29.2V288h32c53 0 96 43 96 96c0 30.4-12.8 47.9-22.2 56.7c-5.5 5.1-9.8 12-9.8 19.5c0 10.9 8.8 19.7 19.7 19.7c2.8 0 5.6-.6 8.1-1.9C494.5 467.9 576 417.3 576 304c0-97.2-78.8-176-176-176H352V64z" />
                                        </svg>
                                        Repay
                                    </button>
                                </div>
                                {borrowOption.borrow && <div className='py-2 text-sm font-semibold text-gray-900/70'>
                                    You can borrow XNJ by collateralizing your INJ at 0% interest. You can receive your INJ back whenever you want securely.
                                </div>}
                                {(borrowOption.borrow && user.appConfig.borrow_state === 'pause') && <div className="flex items-center mb-2">
                                    <span className="text-xs font-ibm text-warning">
                                        Borrowing feature is temporarily paused. Users can get $XNJ on DojoSwap now. Please stay tuned for updates!
                                    </span>
                                </div>}
                            </div>
                            <div className="overflow-y-auto whitespace-nowrap text-sm font-semibold">
                                {borrowOption.borrow && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                Input Collateral
                                            </label>
                                            <div className="text-sm font-semibold text-gray-900/70">${(borrowData.INJ_price * Number(borrowData.amount)).toLocaleString()}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex">
                                                <input
                                                    disabled={user.appConfig.borrow_state !== 'enable'}
                                                    type="text"
                                                    id="collateral"
                                                    className="bg-white border-2 text-gray-900/70 border-gray-300 p-2 rounded-lg w-64 focus:outline-none focus:border-blue-500"
                                                    placeholder="0"
                                                    value={borrowData.amount}
                                                    onChange={(e) => {
                                                        const amount = parseFloat(e.target.value);

                                                        (e.target.value === '' || isNumeric(e.target.value)) && setBorrowData((prev: any) => ({ ...prev, amount: (e.target.value.length > 1 && e.target.value[0] === '0' && !e.target.value.startsWith('0.')) ? e.target.value.slice(1, e.target.value.length - 1) : e.target.value, borrowAmount: ((amount * prev.INJ_price) / prev.XNJ_price) / 100 * borrowData.borrow_percent }));
                                                    }}
                                                />
                                                <div className="flex items-center mb-2 mt-1 ml-3">
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-2 font-black">INJ</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70 mt-2">
                                                    Available: {(() => {
                                                        const coin = coinlist.find(i => i.token === 'INJ');

                                                        return roundDown(coin?.balance || '0', 2);
                                                    })()} INJ
                                                </label>
                                                <span onClick={() => {
                                                    const token = coinlist.find(value => value.token === 'INJ');
                                                    const convertAmount = Number(roundDown(token?.balance || '0', 2, true));
                                                    const amount = convertAmount > 0 ? convertAmount : 0;
                                                    token && setBorrowData((prev: any) => ({ ...prev, amount: amount, borrowAmount: ((amount * prev.INJ_price) / prev.XNJ_price) / 100 * borrowData.borrow_percent }));
                                                }} className="hover:cursor-pointer inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Max</span>
                                            </div>
                                            <div className="flex ml-[35%] mt-5 mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 448 512">
                                                    <path d="M246.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 402.7 361.4 265.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-160 160zm160-352l-160 160c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 210.7 361.4 73.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
                                                </svg>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                    You'll Receive
                                                </label>
                                                <div className="text-sm font-semibold text-gray-900/70">${(borrowData.XNJ_price * Number(borrowData.borrowAmount)).toLocaleString()}</div>
                                            </div>
                                            <div className="flex">
                                                <input
                                                    type="number"
                                                    id="collateral"
                                                    className="bg-white border-2 text-gray-900/70 border-gray-300 p-2 rounded-lg w-64"
                                                    placeholder="0"
                                                    value={borrowData.borrowAmount}
                                                    disabled
                                                />
                                                <div className="flex items-center mb-2 mt-1 ml-3">
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-2 font-black">XNJ</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <button
                                                onClick={() => {
                                                    if (isNaN(Number(borrowData.amount))) {
                                                        toast.error(`Please enter quantity!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                        return;
                                                    };

                                                    const coin = coinlist.find(i => i.token === 'INJ');

                                                    if (!coin || Number(borrowData.amount) > Number(coin.balance)) {
                                                        toast.error(`The balance is not enough to borrow!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                        return;
                                                    };

                                                    setBorrowOption((prev) => ({ ...prev, borrowActive: true }));

                                                    showDialog({ type: 'CONFIRM_BORROW', amount: Number(borrowData.amount), borrowAmount: borrowData.borrowAmount });
                                                }}
                                                disabled={isNaN(Number(borrowData.amount)) || Number(borrowData.amount) === 0 || borrowOption.borrowActive || user.appConfig.borrow_state !== 'enable'}
                                                className="btn bg-gray-700 text-white w-full py-2 rounded-full hover:bg-gray-500 active:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-[0.8] disabled:hover:bg-gray-700 disabled:active:bg-gray-700 focus:outline-none"
                                            >
                                                {borrowOption.borrowActive && (
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
                                                Borrow
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {borrowOption.repay && (
                                    <>
                                        <div className="flex-col items-center mb-2 border p-4 rounded-lg">
                                            <div className='flex justify-between items-center'>
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                    Collateral
                                                </label>
                                                <div className="text-sm font-semibold text-gray-900/70">
                                                    <div className='flex justify-center items-center'>
                                                        <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png" alt="" />
                                                        <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(parseFloat(roundDown(ethers.formatEther(repayData.total_inj_staked), 2)))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex justify-between items-center'>
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                    Debt
                                                </label>
                                                <div className="text-sm font-semibold text-gray-900/70">
                                                    <div className='flex justify-center items-center'>
                                                        <img className="w-5 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png" alt="" />
                                                        <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(parseFloat(roundDown(ethers.formatEther(repayData.total_xnj_received), 2)))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex justify-between items-center'>
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                    LTV
                                                </label>
                                                <div className="text-sm font-semibold text-gray-900/70">
                                                    <div className='flex justify-center items-center'>
                                                        <span className={`flex font-bold text-black font-ibm`}>{(() => {
                                                            const debt = parseFloat(ethers.formatEther(repayData.total_xnj_received));
                                                            const collateral = parseFloat(ethers.formatEther(repayData.total_inj_staked));
                                                            const value = (debt * user.appConfig.XNJ_price) / (collateral * borrowData.INJ_price);
                                                            const showValue = (!isNaN(value) ? formatPriceNumber(value, 2) : '0.00') + '%';
                                                            return showValue.startsWith('0.') ? showValue.slice(2, showValue.length) : showValue;
                                                        })()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex mt-5">
                                                <input
                                                    type="text"
                                                    id="collateral"
                                                    className="bg-white border-2 border-gray-300 p-2 px-4 rounded-full w-full focus:outline-none focus:border-blue-500"
                                                    placeholder="Input amount of XNJ token"
                                                    value={borrowData.amount}
                                                    onChange={(e) => {
                                                        const amount = parseFloat(e.target.value);

                                                        (e.target.value === '' || isNumeric(e.target.value)) && setBorrowData((prev: any) => ({ ...prev, amount: (e.target.value.length > 1 && e.target.value[0] === '0' && !e.target.value.startsWith('0.')) ? e.target.value.slice(1, e.target.value.length - 1) : e.target.value, borrowAmount: (Number(roundDown(amount, 2)) * prev.INJ_price) / prev.XNJ_price }));
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70 mt-2">
                                                    Available: {(() => {
                                                        const coin = coinlist.find(i => i.token === 'XNJ');

                                                        return roundDown(coin?.balance || '0', 2);
                                                    })()} XNJ
                                                </label>

                                                <span onClick={() => {
                                                    const token = coinlist.find(value => value.token === 'XNJ');
                                                    const convertAmount = Number(roundDown(token?.balance || '0', 2, true));
                                                    const amount = convertAmount > 0 ? convertAmount : 0;
                                                    token && setBorrowData((prev: any) => ({ ...prev, amount, borrowAmount: (Number(roundDown(amount, 2)) * prev.INJ_price) / prev.XNJ_price }));
                                                }} className="hover:cursor-pointer inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Max</span>
                                            </div>
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => {
                                                        if (isNaN(Number(borrowData.amount))) {
                                                            toast.error(`Please enter quantity!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                            return;
                                                        };

                                                        if (Number(borrowData.amount) > Number(ethers.formatEther(repayData.total_xnj_received))) {
                                                            toast.error(`The balance is not enough to repay!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                            return;
                                                        };

                                                        setBorrowOption((prev) => ({ ...prev, repayActive: true }));

                                                        showDialog({ type: 'CONFIRM_REPAY', amount: Number(borrowData.amount) });
                                                    }}
                                                    disabled={isNaN(Number(borrowData.amount)) || Number(borrowData.amount) === 0 || borrowOption.repayActive}
                                                    className="btn bg-gray-700 text-white w-full py-2 rounded-full hover:bg-gray-500 active:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-[0.8] disabled:hover:bg-gray-700 disabled:active:bg-gray-700 focus:outline-none"
                                                >
                                                    {borrowOption.repayActive && (
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
                                                    Repay
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {borrowOption.borrow && (
                            <div className="panel mx-2 border mt-4 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                                <span className="text-base font-black">Borrow History</span>
                                <div className="max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] mt-2">
                                    <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                                        <table className="table-auto text-xs">
                                            <thead className="sticky top-0 text-xs">
                                                <tr className='bg-[#f6f7fa]'>
                                                    <th className="text-center">Create Date</th>
                                                    <th className="text-center">Collateral</th>
                                                    <th className="text-center">Loan Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                                {borrowData.historys.map((value, index) => (
                                                    <tr key={index} className="w-full">
                                                        <td className="text-center">{new Date(value.created_at).toLocaleString()}</td>
                                                        <td>
                                                            <div className='flex justify-center items-center'>
                                                                <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png" alt="" />
                                                                <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(parseFloat(roundDown(ethers.formatEther(value.amount), 2)))}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className='flex justify-center items-center'>
                                                                <img className="w-5 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png" alt="" />
                                                                <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(parseFloat(roundDown(ethers.formatEther(value.loanAmount), 2)))}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {(borrowOption.repay && user.appConfig.data.liquidated) && (
                            <div className="panel mx-2 border mt-4 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                                <span className="text-base font-black">Liquidated History</span>
                                <div className="max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] mt-2">
                                    <div className="table-responsive mb-5 h-20 max-h-20 overflow-y-auto scrollbar-hide">
                                        <table className="table-auto text-xs">
                                            <thead className="sticky top-0 text-xs">
                                                <tr className='bg-[#f6f7fa]'>
                                                    <th className="text-center">Liquidation Amount</th>
                                                    <th className="text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                                <tr className="w-full">
                                                    <td>
                                                        <div className='flex justify-center items-center'>
                                                            <img className="w-5 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png" alt="" />
                                                            <span className={`flex font-bold text-black font-ibm`}>{borrowData.historys.reduce((previousValue, currentValue) => {
                                                                return previousValue + parseFloat(ethers.formatEther(currentValue.amount));
                                                            }, 0) - (repayData.historys.reduce((previousValue, currentValue) => {
                                                                return previousValue + parseFloat(ethers.formatEther(currentValue.repayAmount));
                                                            }, 0))}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-center">
                                                            <span className="inline-flex items-center rounded-md bg-red-400 bg-opacity-20 p-1 text-xs font-- text-red-500">Liquidated</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {borrowOption.repay && (
                            <div className="panel mx-2 border mt-4 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                                <span className="text-base font-black">Repay History</span>
                                <div className="max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] mt-2">
                                    <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                                        <table className="table-auto text-xs">
                                            <thead className="sticky top-0 text-xs">
                                                <tr className='bg-[#f6f7fa]'>
                                                    <th className="text-center">Paid Date</th>
                                                    <th className="text-center">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                                {repayData.historys.map((value, index) => (
                                                    <tr key={index} className="w-full">
                                                        <td className="text-center">{new Date(value.created_at).toLocaleString()}</td>
                                                        <td>
                                                            <div className='flex justify-center items-center'>
                                                                <img className="w-5 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png" alt="" />
                                                                <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(parseFloat(roundDown(ethers.formatEther(value.amount), 2)))}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {(tabs === 'convert' && !(user.appConfig.convert_elem_to_xnj_state === 'disable' && user.appConfig.convert_xnj_to_elem_state === 'disable')) && (
                    <>
                        <div className="panel mx-2 border max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                            <div className="mb-4 overflow-y-auto whitespace-nowrap flex justify-center text-sm font-semibold">
                                <div className="rounded-lg shadow-sm inline-flex items-center w-full justify-between" role="group">
                                    <label className="font-ibm mt-1">Convert {convertOption.reverse ? 'XNJ to ELEM' : 'ELEM to XNJ'}</label>
                                    {!(user.appConfig.convert_elem_to_xnj_state === 'disable' || user.appConfig.convert_xnj_to_elem_state === 'disable') && <button
                                        onClick={() => {
                                            setConvertData((prev) => ({ ...prev, amount: '0' }));
                                            setConvertOption((prev) => ({ ...prev, reverse: !prev.reverse }))
                                        }}
                                        type="button"
                                        className={`items-center px-12 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full`}
                                    >
                                        <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96H320v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32V64H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192V352c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448H352c88.4 0 160-71.6 160-160z" />
                                        </svg>
                                    </button>}
                                </div>
                            </div>
                            <div className="overflow-y-auto whitespace-nowrap text-sm font-semibold">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                            Input {convertOption.reverse ? 'XNJ amount' : 'ELEM amount'}
                                        </label>
                                        <span>Available: {!convertToken || convertToken.isLoading ? 'Loading...' : roundDown(convertToken?.balance, 2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="bg-white border-2 border-gray-300 p-2 rounded-lg w-64 focus:outline-none focus:border-blue-500"
                                                placeholder="0"
                                                value={!!convertData.amount ? convertData.amount : ''}
                                                onChange={(e) => {
                                                    const amount = (e.target.value === '' || isNumeric(e.target.value)) && (e.target.value.length > 1 && e.target.value[0] === '0' && !e.target.value.startsWith('0.')) ? e.target.value.slice(1, e.target.value.length - 1) : e.target.value;

                                                    (e.target.value === '' || isNumeric(e.target.value)) && setConvertData((prev: any) => ({ ...prev, amount: amount }));
                                                }}
                                            />
                                            {convertOption.reverse ? (
                                                <div className="flex items-center mb-2 mt-1 ml-2">
                                                    <span onClick={() => {
                                                        const token = coinlist.find(value => value.token === 'XNJ');
                                                        const convertAmount = Number(roundDown(token?.balance || '0', 2, true));
                                                        const amount = convertAmount > 0 ? convertAmount : 0;
                                                        token && setConvertData((prev: any) => ({ ...prev, amount }))
                                                    }} className="hover:cursor-pointer inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">Max</span>
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-1 text-xs font-black">XNJ</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center mb-2 mt-1 ml-2">
                                                    <span onClick={() => {
                                                        const token = coinlist.find(value => value.token === 'ELEM');
                                                        const convertAmount = Number(roundDown(token?.balance || '0', 2, true));
                                                        const amount = convertAmount > 0 ? convertAmount : 0;
                                                        token && setConvertData((prev: any) => ({ ...prev, amount: amount > user.appConfig.max_user_convert ? user.appConfig.max_user_convert : amount }))
                                                    }} className="hover:cursor-pointer inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">Max</span>
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-1 text-xs font-black">ELEM</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex ml-[35%] mt-5 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 448 512">
                                                <path d="M246.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 402.7 361.4 265.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-160 160zm160-352l-160 160c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 210.7 361.4 73.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
                                            </svg>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                                                You'll Receive
                                            </label>
                                        </div>
                                        <div className="flex">
                                            <input
                                                type="number"
                                                id="collateral"
                                                className="bg-white border-2 border-gray-300 p-2 rounded-lg w-64"
                                                placeholder="0"
                                                value={!!convertData.amount ? convertData.amount : ''}
                                                disabled
                                            />
                                            {!convertOption.reverse ? (
                                                <div className="flex items-center mb-2 mt-1 ml-3">
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-1 text-xs font-black">XNJ</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center mb-2 mt-1 ml-3">
                                                    <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png'} alt="" className="w-8 h-8" />
                                                    <span className="ml-1 text-xs font-black">ELEM</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        <button
                                            onClick={() => {
                                                if ((!convertOption.reverse && user.appConfig.convert_elem_to_xnj_state === 'pause')) {
                                                    toast.error(`$ELEM > $XNJ conversion is coming soon.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                    return;
                                                };

                                                const convertAmount = Number(convertData.amount);

                                                if (isNaN(convertAmount)) {
                                                    toast.error(`Please enter quantity!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                    return;
                                                };

                                                if (!convertOption.reverse && (convertAmount < user.appConfig.min_user_convert || convertAmount > user.appConfig.max_user_convert)) {
                                                    toast.error(`convert minimum ${user.appConfig.min_user_convert} ELEM and maximum ${user.appConfig.max_user_convert} ELEM.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                    return;
                                                };

                                                const coin = coinlist.find(i => i.token === (convertOption.reverse ? 'XNJ' : 'ELEM'));

                                                if (!coin || Number(convertData.amount) > Number(coin.balance)) {
                                                    toast.error(`The balance is not enough to convert!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                    return;
                                                };

                                                setConvertOption((prev) => ({ ...prev, active: true }));

                                                showDialog({ type: 'CONFIRM_CONVERT', reverse: convertOption.reverse, amount: Number(convertData.amount) });
                                            }}
                                            disabled={isNaN(Number(convertData.amount)) || Number(convertData.amount) === 0 || convertOption.active}
                                            className="btn bg-gray-700 text-white w-full py-2 rounded-full hover:bg-gray-500 active:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-[0.8] disabled:hover:bg-gray-700 disabled:active:bg-gray-700 focus:outline-none"
                                        >
                                            {convertOption.active && (
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
                                            Convert
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!convertOption.reverse && <div className="panel mx-2 border mt-4 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-base font-black">In progress</span>
                                <ConvertClaimButton coinlist={coinlist} setCoinlist={setCoinlist} convertOption={convertOption} convertData={convertData} setConvertOption={setConvertOption} setConvertData={setConvertData} reloadMe={reloadMe} />
                            </div>
                            <div className="max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] mt-2">
                                <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                                    <table className="table-auto text-xs">
                                        <thead className="sticky top-0 text-xs">
                                            <tr className='bg-[#f6f7fa]'>
                                                <th className="text-center">Will be available at</th>
                                                <th className="text-center">Amount</th>
                                                <th className="text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                            {convertData.expected_claim_at && convertData.claims.map((value, index) => {
                                                function ConvertList() {
                                                    const convertDate = convertData.can_claim_convert ? new Date() : new Date(convertData.expected_claim_at);

                                                    const [timeAgo, setTimeAgo] = useState(() => calculateTimeDifference(new Date(), convertDate));

                                                    useEffect(() => {
                                                        const intervalId = setInterval(() => {
                                                            setTimeAgo(calculateTimeDifference(new Date(), convertDate));
                                                        }, 1000);

                                                        return () => clearInterval(intervalId);
                                                    }, []);

                                                    function calculateTimeDifference(date1: Date, date2: Date) {
                                                        if (typeof date1 === "string") date1 = new Date(date1);

                                                        const timeDifferenceInMs = date2.getTime() - date1.getTime();

                                                        const seconds = Math.floor(timeDifferenceInMs / 1000);
                                                        const minutes = Math.floor(seconds / 60);
                                                        const hours = Math.floor(minutes / 60);
                                                        const days = Math.floor(hours / 24);

                                                        if (days > 0) {
                                                            return days === 1 ? `${days}d` : `${days}d`;
                                                        }
                                                        if (hours > 0) {
                                                            return hours === 1 ? `${hours}h` : `${hours}h`;
                                                        }
                                                        if (minutes > 0) {
                                                            return minutes === 1 ? `${minutes}m` : `${minutes}m`;
                                                        }
                                                        if (seconds > 0) {
                                                            return seconds === 1 ? `${seconds}s` : `${seconds}s`;
                                                        }
                                                        return "0";
                                                    }

                                                    return (
                                                        <tr key={index} className="w-full">
                                                            <td className="text-center">{convertDate.toLocaleDateString()}</td>
                                                            <td className="items-center">
                                                                <div className='flex'>
                                                                    <img className="w-5 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png" alt="" />
                                                                    <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(Number(roundDown(value.amount, 2)))}</span>
                                                                </div>
                                                            </td>
                                                            <td className="flex items-center justify-center">
                                                                {timeAgo === '0' ? (
                                                                    <span className="flex items-center font-ibm text-gray-900 dark:text-white">
                                                                        <span className="text-xs flex w-2.5 h-2.5 bg-success rounded-full flex-shrink-0"></span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center font-ibm text-gray-900 dark:text-white">
                                                                        <span className="text-xs flex w-2.5 h-2.5 bg-warning rounded-full flex-shrink-0"></span>
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                };

                                                return <ConvertList key={index} />;
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>}
                        <div className="panel mx-2 border mt-4 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                            <div className="flex items-center mb-2">
                                <span className="text-base font-black">Convert History</span>
                            </div>
                            <div className="max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] mt-2">
                                <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                                    <table className="table-auto text-xs">
                                        <thead className="sticky top-0 text-xs">
                                            <tr className='bg-[#f6f7fa]'>
                                                <th className="text-center">Date</th>
                                                <th className="text-center">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                            {convertOption.reverse ? convertData.historys.map((value, index) => {
                                                const convertDate = new Date(value.created_at);

                                                return (
                                                    <tr key={index} className="w-full">
                                                        <td className="text-center">{convertDate.toLocaleString()}</td>
                                                        <td className="flex items-center justify-center">
                                                            <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png" alt="" />
                                                            <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(Number(roundDown(value.amount, 2)))}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : convertData.reverse_historys.map((value, index) => {
                                                const convertDate = new Date(value.created_at);

                                                return (
                                                    <tr key={index} className="w-full">
                                                        <td className="text-center">{convertDate.toLocaleString()}</td>
                                                        <td className="flex items-center justify-center">
                                                            <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png" alt="" />
                                                            <span className={`flex font-bold text-black font-ibm`}>{formatPriceNumber(Number(roundDown(value.amount, 2)))}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {tabs === 'settings' && (
                    <>
                        <div className="flex w-full flex-col">
                            <ol className="mb-4 flex flex-wrap items-center justify-center gap-y-4 text-xs font-semibold">
                                <li>
                                    <button
                                        onClick={() => window.open('https://xninja.tech', '_blank')}
                                        className="flex items-center justify-center rounded-lg border border-gray-500/20 !bg-[#f5f5f5] text-black p-2 shadow"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 ltr:mr-1 rtl:ml-2">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M2.02783 11.25C2.41136 6.07745 6.72957 2 12.0001 2C11.1693 2 10.4295 2.36421 9.82093 2.92113C9.21541 3.47525 8.70371 4.24878 8.28983 5.16315C7.87352 6.08292 7.55013 7.15868 7.33126 8.32611C7.1558 9.26194 7.04903 10.2485 7.01344 11.25H2.02783ZM2.02783 12.75H7.01344C7.04903 13.7515 7.1558 14.7381 7.33126 15.6739C7.55013 16.8413 7.87351 17.9171 8.28983 18.8368C8.70371 19.7512 9.21541 20.5247 9.82093 21.0789C10.4295 21.6358 11.1693 22 12.0001 22C6.72957 22 2.41136 17.9226 2.02783 12.75Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M12.0001 3.39535C11.7251 3.39535 11.3699 3.51236 10.9567 3.89042C10.5406 4.27126 10.1239 4.86815 9.75585 5.68137C9.3902 6.4892 9.09329 7.46441 8.88897 8.55419C8.72806 9.41242 8.62824 10.3222 8.59321 11.25H15.4071C15.372 10.3222 15.2722 9.41242 15.1113 8.5542C14.907 7.46441 14.6101 6.48921 14.2444 5.68137C13.8763 4.86815 13.4597 4.27126 13.0435 3.89042C12.6304 3.51236 12.2751 3.39535 12.0001 3.39535Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M8.88897 15.4458C9.09329 16.5356 9.3902 17.5108 9.75585 18.3186C10.1239 19.1319 10.5406 19.7287 10.9567 20.1096C11.3698 20.4876 11.7251 20.6047 12.0001 20.6047C12.2751 20.6047 12.6304 20.4876 13.0435 20.1096C13.4597 19.7287 13.8763 19.1319 14.2444 18.3186C14.6101 17.5108 14.907 16.5356 15.1113 15.4458C15.2722 14.5876 15.372 13.6778 15.4071 12.75H8.59321C8.62824 13.6778 8.72806 14.5876 8.88897 15.4458Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M12.0001 2C12.831 2 13.5708 2.36421 14.1793 2.92113C14.7849 3.47525 15.2966 4.24878 15.7104 5.16315C16.1267 6.08292 16.4501 7.15868 16.669 8.32612C16.8445 9.26194 16.9512 10.2485 16.9868 11.25H21.9724C21.5889 6.07745 17.2707 2 12.0001 2Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M16.669 15.6739C16.4501 16.8413 16.1267 17.9171 15.7104 18.8368C15.2966 19.7512 14.7849 20.5247 14.1793 21.0789C13.5708 21.6358 12.831 22 12.0001 22C17.2707 22 21.5889 17.9226 21.9724 12.75H16.9868C16.9512 13.7515 16.8445 14.7381 16.669 15.6739Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        Website
                                    </button>
                                </li>
                                <li className="flex items-center before:relative before:-top-0.5 before:mx-4 before:inline-block before:h-1 before:w-1 before:rounded-full before:bg-black">
                                    <button
                                        onClick={() => window.open('https://twitter.com/xninja_tech', '_blank')}
                                        className=" flex items-center justify-center rounded-lg border border-gray-500/20 !bg-[#f5f5f5] text-black p-2 shadow"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill="#000" className="h-5 w-5 shrink-0 ltr:mr-1 rtl:ml-2">
                                            <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                        </svg>
                                        Twitter
                                    </button>
                                </li>
                                <li className="flex items-center before:relative before:-top-0.5 before:mx-4 before:inline-block before:h-1 before:w-1 before:rounded-full before:bg-black">
                                    <button
                                        onClick={() => window.open('https://docs.xninja.tech', '_blank')}
                                        className=" flex items-center justify-center rounded-lg border border-gray-500/20 !bg-[#f5f5f5] text-black p-2 shadow"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512" fill="#000" className="h-5 w-5 ltr:mr-2 rtl:ml-1">
                                            <path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z" />
                                        </svg>
                                        Docs
                                    </button>
                                </li>
                            </ol>
                            <div>
                                <div className="flex mx-2 flex-col rounded-lg border border-white-light">
                                    <div
                                        onClick={() =>
                                            user.two_factor_enabled
                                                ? setCurrentPage('2fa_page_verify')
                                                : toast('You need to enable the 2FA feature to be able to export wallet', { duration: 3000, className: 'font-ibm text-xs' })
                                        }
                                        className="flex border-b border-white-light px-4 py-2.5 hover:cursor-pointer hover:bg-[#eee]"
                                    >
                                        <div className="mt-0.5 text-primary ltr:mr-2 rtl:ml-2.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" fill="#3b3f5c" viewBox="0 0 512 512">
                                                <path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 font-semibold">
                                            <h6 className={`mb-1 text-sm text-dark`}>Export your wallet Private Key</h6>
                                            <p className="text-xs">You need to enable 2FA</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => (user.two_factor_enabled ? setCurrentPage('2fa_page_4') : setCurrentPage('2fa_page_1'))}
                                        className="flex border-b border-white-light px-4 py-2.5 hover:cursor-pointer hover:bg-[#eee]"
                                    >
                                        <div className="mt-0.5 text-primary ltr:mr-2 rtl:ml-2.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill="#3b3f5c">
                                                <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V448h40c13.3 0 24-10.7 24-24V384h40c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 font-semibold">
                                            <h6 className={`mb-1 text-sm text-dark`}>2-Factor Authentication</h6>
                                            <p className="text-xs"></p>
                                        </div>
                                    </div>
                                    <div className="flex px-4 py-2.5 hover:cursor-pointer hover:bg-[#eee]" onClick={() => signOut(() => window.location.reload())}>
                                        <div className="mt-0.5 text-primary ltr:mr-2 rtl:ml-2.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" height="16" width="16" viewBox="0 0 512 512" fill="#e7515a">
                                                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 font-semibold">
                                            <h6 className="mb-1 text-sm !text-danger">Logout</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {params && (
                <Transition appear show={addModal} as={Fragment}>
                    <Dialog
                        as="div"
                        open={addModal}
                        onClose={() => {
                            setModal(false);
                            setActiveModal(false);
                            setBorrowOption((prev) => ({ ...prev, borrowActive: false, repayActive: false }));
                            setConvertOption((prev) => ({ ...prev, active: false }));
                        }}
                        className="relative z-50"
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
                        <div className="fixed inset-0 overflow-y-auto">
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
                                        {params.type === 'CONFIRM_BORROW' && (
                                            <>
                                                <div className="flex flex-col border-b border-white-light font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModal(false);
                                                            setActiveModal(false);
                                                            setBorrowOption((prev) => ({ ...prev, borrowActive: false }));
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
                                                    <div className="pt-4 text-lg font-medium ltr:pl-5 ltr:pr-[15px] rtl:pl-[50px] rtl:pr-5">
                                                        <div className="flex w-full items-center">
                                                            <span className='text-sm'>You are collateralizing {params.amount} INJ to borrow {roundDown(params.borrowAmount, 2)} XNJ. Your borrow will have an interest rate of 0%. 👉 By clicking "Confirm" below, you agree to our <a className="text-[#4A99D9]" href="https://docs.xninja.tech/other-information/borrow-policy" target="_blank">Borrow Policy</a>.</span>
                                                        </div>
                                                    </div>
                                                    <span className='text-sm px-5 py-2'>You can receive your INJ back whenever you want securely.</span>
                                                    <div className="w-80 h-auto bg-white pb-4 flex flex-col items-center">
                                                        <div className="w-72 flex justify-center">
                                                            <button
                                                                className="btn shadow-none outline-none bg-black text-white rounded-full w-full hover:bg-black/80 active:bg-black/90"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setActiveModal(true);

                                                                    axiosApi
                                                                        .post(`${import.meta.env.VITE_API_URL}/api/blockchain/borrow`, { amount: params.amount })
                                                                        .then((response) => {
                                                                            toast.success(`Borrow ${roundDown(params.borrowAmount, 2)} XNJ successfully`, { duration: 3000, className: 'font-ibm text-xs' });
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

                                                                            setBorrowData((prev: any) => ({ ...prev, amount: 0, borrowAmount: 0, historys: response.data.historys }))
                                                                        })
                                                                        .catch((error) => {
                                                                            console.error(error);
                                                                            if (error.response.status === 403) {
                                                                                signOut(reloadMe);
                                                                            } else if (error.response.status === 404) {
                                                                                if (error.response.data.status === 'BORROW_DISABLED') {
                                                                                    toast.error(`Borrowing is not available.`, { duration: 3000, className: 'font-ibm text-xs' });
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
                                                                        })
                                                                        .finally(() => {
                                                                            setBorrowOption((prev) => ({ ...prev, borrowActive: false }));
                                                                            setModal(false);
                                                                            setActiveModal(false);

                                                                            axiosApi
                                                                                .get(`${import.meta.env.VITE_API_URL}/api/blockchain/get-repay`)
                                                                                .then((response) => {
                                                                                    setRepayData((prev: any) => ({ ...prev, historys: response.data.historys, total_inj_staked: response.data.total_inj_staked, total_xnj_received: response.data.total_xnj_received }));
                                                                                })
                                                                                .catch((error) => {
                                                                                    console.error('Error fetching repays', error);
                                                                                    error.response.status === 403 && signOut(reloadMe);
                                                                                });
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
                                                                Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {params.type === 'CONFIRM_REPAY' && (
                                            <>
                                                <div className="flex flex-col border-b border-white-light font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModal(false);
                                                            setActiveModal(false);
                                                            setBorrowOption((prev) => ({ ...prev, repayActive: false }));
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
                                                    <div className="py-4 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5">
                                                        <div className="flex w-full items-center">
                                                            <span className='text-sm'>You are repaying {params.amount} XNJ to receive your {(() => {
                                                                const debt = parseFloat(ethers.formatEther(repayData.total_xnj_received));
                                                                const collateral = parseFloat(ethers.formatEther(repayData.total_inj_staked));
                                                                return (collateral / debt) * params.amount;
                                                            })()} INJ back. Please confirm to continue</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-80 h-auto bg-white pb-4 flex flex-col items-center">
                                                        <div className="w-72 flex justify-center">
                                                            <button
                                                                className="btn shadow-none outline-none bg-black text-white rounded-full w-full hover:bg-black/80 active:bg-black/90"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setActiveModal(true);

                                                                    axiosApi
                                                                        .post(`${import.meta.env.VITE_API_URL}/api/blockchain/repay`, { amount: params.amount })
                                                                        .then((response) => {
                                                                            toast.success(`Repay ${roundDown(params.amount, 2)} XNJ successfully`, { duration: 3000, className: 'font-ibm text-xs' });
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

                                                                            setBorrowData(prev => ({ ...prev, amount: '', borrowAmount: 0 }))

                                                                            setRepayData((prev: any) => ({ ...prev, historys: response.data.historys, total_inj_staked: response.data.total_inj_staked, total_xnj_received: response.data.total_xnj_received }));
                                                                        })
                                                                        .catch((error) => {
                                                                            console.error(error);
                                                                            if (error.response.status === 403) {
                                                                                signOut(reloadMe);
                                                                            } else if (error.response.status === 404) {
                                                                                if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                                                    toast.error(`You don't have enough.`, { duration: 3000, className: 'font-ibm text-xs' });
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
                                                                        })
                                                                        .finally(() => {
                                                                            setBorrowOption((prev) => ({ ...prev, repayActive: false }));
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
                                                                Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {params.type === 'CONFIRM_CONVERT' && (
                                            <>
                                                <div className="flex flex-col border-b border-white-light font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModal(false);
                                                            setActiveModal(false);
                                                            setConvertOption((prev) => ({ ...prev, active: false }));
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
                                                    <div className="py-4 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5">
                                                        <div className="flex w-full items-center">
                                                            <span className='text-sm'>You are converting {params.amount} {params.reverse ? 'XNJ' : 'ELEM'} to receive {roundDown(params.amount, 2)} {params.reverse ? 'ELEM' : 'XNJ'}.</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-80 h-auto bg-white pb-4 flex flex-col items-center">
                                                        <div className="w-72 flex justify-center">
                                                            <button
                                                                className="btn shadow-none outline-none bg-black text-white rounded-full w-full hover:bg-black/80 active:bg-black/90"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setActiveModal(true);

                                                                    axiosApi
                                                                        .post(`${import.meta.env.VITE_API_URL}/api/blockchain/convert`, { reverse: params.reverse, amount: params.amount })
                                                                        .then((response) => {
                                                                            toast.success('You have successfully converted!', { duration: 3000, className: 'font-ibm text-xs' });
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

                                                                            const reverse_historys = response.data.reverse_historys;
                                                                            const historys = response.data.historys;
                                                                            const claims = response.data.claims;

                                                                            if (historys) {
                                                                                setConvertData((prev: any) => ({ ...prev, amount: 0, historys }));
                                                                            } else if (claims) {
                                                                                setConvertData((prev: any) => ({ ...prev, amount: 0, claims, reverse_historys, can_claim_convert: response.data.can_claim_convert, expected_claim_at: response.data.expected_claim_at }));
                                                                            };
                                                                        })
                                                                        .catch((error) => {
                                                                            console.error(error);
                                                                            if (error.response.status === 403) {
                                                                                signOut(reloadMe);
                                                                            } else if (error.response.status === 404) {
                                                                                if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                                                    toast.error(`You don't have enough.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                                                    toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                                                    toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'CLAIM_LIMITED') {
                                                                                    toast.error(`The conversion limit has been reached for the day!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                                if (error.response.data.status === 'ALREADY_HAVE_A_CONVERSION') {
                                                                                    toast.error(`You already have a conversion request in progress`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                };
                                                                            } else if (error.response.status === 500) {
                                                                                toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                            };
                                                                        })
                                                                        .finally(() => {
                                                                            setConvertOption((prev) => ({ ...prev, active: false }));
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
                                                                Confirm
                                                            </button>
                                                        </div>
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
