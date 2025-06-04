import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import axios from 'axios';
import { formatPriceNumber } from '../libs/custom';
import toast, { Toaster } from 'react-hot-toast';
import { User, signOut } from '../../hooks/useMeQuery';
import axiosApi from '../libs/axios';

const Index = ({ user, backToProfile, reloadMe }: { user: User; backToProfile: () => void; reloadMe: () => void }) => {
    const [isCoppy, setIsCoppy] = useState<boolean>(false);
    const [user_refs, setUserRefs] = useState<Array<{ username: string; referral_date: string; rewards?: { ELEM: number } }>>([]);
    const [userRewards, setUserRewards] = useState<{ ELEM?: number; claim_at?: Date }>({});
    const [activeClaim, setActiveClaim] = useState<boolean>(false);

    useEffect(() => {
        axiosApi
            .post(`${import.meta.env.VITE_API_URL}/api/profiles/referrals_history`)
            .then((response) => {
                setUserRefs(response.data.user_refs);
                setUserRewards(response.data.user_rewards);
            })
            .catch((error) => {
                if (error.response && error.response.status === 403) {
                    signOut(reloadMe);
                }
            });
    }, []);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        <>
            <div className="flex flex-col max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px] font-ibm">
                <div className="p-5 flex">
                    <svg onClick={() => backToProfile()} className="hover:cursor-pointer mt-1" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#000">
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex w-full justify-center font-semibold">
                    <div className="flex flex-col mx-4 items-center">
                        <span className="text-sm">Your invite</span>
                        <span className={`mt-4 text-center text-base font-bold text-black`}>{user_refs.length || 0}</span>
                    </div>
                    <div className="flex flex-col mx-4 items-center">
                        <span className="text-sm">Reward from Invitees</span>
                        <div className="flex w-full justify-center">
                            <img className="mt-4 w-8 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png" alt="" />
                            <span className={`flex mt-4 items-center text-base font-bold text-black`}>{formatPriceNumber(userRewards.ELEM || 0, 2)}</span>
                        </div>
                        <button
                            className="self-center btn text-white rounded-full bg-[#000] font-ibm w-24 h-8 mt-2"
                            disabled={!userRewards.ELEM || activeClaim || !user.appConfig.allow_referral_claim}
                            onClick={async () => {
                                setActiveClaim(true);
                                try {
                                    const response = await axiosApi.post(`${import.meta.env.VITE_API_URL}/api/profiles/referrals_claim`);
                                    toast.success('Claim successfully!', { duration: 3000, className: 'font-ibm text-xs' });
                                    setUserRewards((prev) => ({
                                        ...prev,
                                        ELEM: prev.ELEM ? prev.ELEM - response.data.balance : 0,
                                    }));
                                } catch (error) {
                                    if (axios.isAxiosError(error)) {
                                        if (error.response) {
                                            if (error.response.status === 403) {
                                                signOut(reloadMe);
                                            } else if (error.response.status === 404) {
                                                const status = error.response.data.status;
                                                if (status === 'SOMETHING_WENT_WRONG') {
                                                    toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                } else if (status === 'NOT_ENOUGH_GAS') {
                                                    toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                } else if (status === 'NO_REWARDS_TO_CLAIM') {
                                                    toast.error(`There are no rewards to claim!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                }
                                            } else if (error.response.status === 500) {
                                                toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                            };
                                        }
                                    } else {
                                        console.error('An unknown error occurred', error);
                                    }
                                } finally {
                                    setActiveClaim(false);
                                };
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
                    <div className="flex flex-col mx-4 items-center">
                        <span className="text-sm">Chips</span>
                        <div className="flex w-full justify-center">
                            <img className="mt-4 w-8" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/chip.svg" alt="" />
                            <span className={`flex mt-4 items-center text-base font-bold text-black`}>{user.boosts?.count || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="panel mt-5 p-2 h-18 flex flex-col rounded-xl border text-black justify-between">
                    <div className='flex w-full p-1'>
                        <span className="w-full text-sm">Copy invite code</span>
                        <div className="flex">
                            <span className="mr-1 text-sm">{user.invite_code}</span>
                            <CopyToClipboard
                                text={user.invite_code}
                                onCopy={(_, result) => {
                                    if (result) setIsCoppy(true);
                                }}
                            >
                                {isCoppy === true ? (
                                    <svg className="hover:cursor-pointer ltr:mr-2 rtl:ml-2" fill="#000" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
                                        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                    </svg>
                                ) : (
                                    <svg className="hover:cursor-pointer ltr:mr-2 rtl:ml-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    </div>
                    <div className="flex w-full items-center">
                        <span className='text-xs opacity-[0.8]' style={{ fontWeight: 200 }}>Invite friends to join and earn Chips to boost up to 125% training/farming rate. <a className="text-[#4A99D9]" href="https://docs.xninja.tech/features/referral/chip" target="_blank">What is Chip?</a></span>
                    </div>
                </div>
                <div className="panel mt-10 flex flex-col w-full rounded-xl text-black border">
                    <span className="text-base font-black mb-1">History</span>
                    <div className="max-w-[365px] xxs:max-w-[420px] xs:max-w-[500px]">
                        <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                            <table className="table-auto text-xs">
                                <thead className="sticky top-0">
                                    <tr>
                                        <th className="text-center">Time</th>
                                        <th className="text-center">User</th>
                                        <th className="text-center">Referrals reward</th>
                                    </tr>
                                </thead>
                                <tbody className="max-h-56 overflow-y-auto scrollbar-hide">
                                    {user_refs.map((data, index) => {
                                        return (
                                            <tr key={index}>
                                                <td>{new Date(data.referral_date).toLocaleString()}</td>
                                                <td>
                                                    <div className="whitespace-nowrap text-center font-ibm">@{data.username}</div>
                                                </td>
                                                <td>
                                                    <div className="flex">
                                                        <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png" alt="" />
                                                        <span className={`flex items-center font-bold text-black`}>{formatPriceNumber(data.rewards?.ELEM || 0, 2)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
};

export default Index;
