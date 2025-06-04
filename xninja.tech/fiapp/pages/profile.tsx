import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Invite from '@/components/invite';
// import { generateWallet }  from '../libs/wallet'

import { getInjectiveAddress } from '@injectivelabs/sdk-ts'
import { ChainId } from '@injectivelabs/ts-types'

const getKeplr = () => {
    //@ts-ignore
    if (!window.keplr) {
      throw new Error('Keplr extension not installed')
    }
    //@ts-ignore
    return window.keplr
  }

interface Seesion {
    data: {
        user?: { id: string; name: string; username: string; profile_image_url: string };
        expries: string;
    };
    status: 'authenticated' | 'loading' | 'unauthenticated';
}

const Index = () => {
    const router = useRouter();
    //@ts-ignore
    const { data: seession, status }: Seesion = useSession();
    const [tabs, setTabs] = useState<string>('tokens');
    const [invitePage, setInvitePage] = useState<boolean>(false);
    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status]);

    if (invitePage) return <Invite backToProfile={() => setInvitePage(false)}/>

    (async() => {
        const keplr = getKeplr()
        const chainId = ChainId.Mainnet
        await keplr.enable(chainId)
        const injectiveAddresses = await keplr.getOfflineSigner(chainId).getAccounts()
      
        console.log(injectiveAddresses)
      })()
      
    return (
        seession && (
            <>
                <div className="mb-2 flex items-center overflow-y-auto border-b border-white-light pb-2 font-semibold dark:border-[#1b2e4b]">
                    <div>Options</div>
                    <div className="flex w-full justify-end">
                        <button className="btn btn-dark my-4 font-bold" onClick={() => setInvitePage(true)}>Invite Friends</button>
                    </div>
                    {/* <div className="flex w-full justify-end">
                        <button className="btn btn-dark my-4 font-bold" onClick={() => generateWallet()}>Create Wallet</button>
                    </div> */}
                </div>
                <div className="mb-2 mt-5 flex items-center pb-2 font-semibold">
                    <div className="flex w-full flex-col items-center">
                        <img className="relative h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-white-dark" src={seession.user?.profile_image_url} alt="img" />
                        <span className="text-md mt-2 font-bold">@{seession.user?.username}</span>
                    </div>
                </div>
                <div className="mb-2 flex max-w-[550px] flex-col">
                    <div>
                        <ul className="mb-5 overflow-y-auto whitespace-nowrap border-b border-white-light font-semibold dark:border-[#1b2e4b]">
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
                            <div className="panel flex !bg-dark text-white">
                                <div className="flex w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 32 32">
                                        <g fill="none" fill-rule="evenodd">
                                            <circle cx="16" cy="16" r="16" fill="#627EEA" />
                                            <g fill="#FFF" fill-rule="nonzero">
                                                <path fill-opacity=".602" d="M16.498 4v8.87l7.497 3.35z" />
                                                <path d="M16.498 4L9 16.22l7.498-3.35z" />
                                                <path fill-opacity=".602" d="M16.498 21.968v6.027L24 17.616z" />
                                                <path d="M16.498 27.995v-6.028L9 17.616z" />
                                                <path fill-opacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
                                                <path fill-opacity=".602" d="M9 16.22l7.498 4.353v-7.701z" />
                                            </g>
                                        </g>
                                    </svg>
                                    <div className="ml-2 flex flex-col">
                                        <span className="text-base font-bold">ETH</span>
                                        <span className="opacity-[0.8]">0</span>
                                    </div>
                                    <div className="mt-2 flex w-full justify-end">
                                        <span className="text-base font-bold">$0</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {tabs === 'settings' && (
                        <>
                            <div className="flex w-full flex-col">
                                <ol className="mb-5 mt-2 flex flex-wrap items-center justify-center gap-y-4 font-semibold text-gray-500 dark:text-white">
                                    <li>
                                        <button
                                            onClick={() => window.open('https://xninja.tech', '_blank')}
                                            className="flex items-center justify-center rounded-md border border-gray-500/20 !bg-dark p-2.5 shadow dark:border-0 dark:bg-[#191e3a] dark:hover:text-white/70"
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
                                    <li className="flex items-center before:relative before:-top-0.5 before:mx-4 before:inline-block before:h-1 before:w-1 before:rounded-full before:bg-primary">
                                        <button
                                            onClick={() => window.open('https://twitter.com/xninja_tech', '_blank')}
                                            className=" flex items-center justify-center rounded-md border border-gray-500/20 !bg-dark p-2.5 shadow dark:border-0 dark:bg-[#191e3a] dark:hover:text-white/70"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill="#fff" className="h-5 w-5 shrink-0 ltr:mr-1 rtl:ml-2">
                                                <path d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" />
                                            </svg>
                                            Twitter
                                        </button>
                                    </li>
                                    <li className="flex items-center before:relative before:-top-0.5 before:mx-4 before:inline-block before:h-1 before:w-1 before:rounded-full before:bg-primary">
                                        <button
                                            onClick={() => window.open('https://docs.xninja.tech', '_blank')}
                                            className=" flex items-center justify-center rounded-md border border-gray-500/20 !bg-dark p-2.5 shadow dark:border-0 dark:bg-[#191e3a] dark:hover:text-white/70"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512" fill="#fff" className="h-5 w-5 ltr:mr-2 rtl:ml-1">
                                                <path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z" />
                                            </svg>
                                            Docs
                                        </button>
                                    </li>
                                </ol>
                                <div>
                                    <div className="flex flex-col rounded-md border border-white-light dark:border-[#1b2e4b]">
                                        <div className="flex border-b border-white-light px-4 py-2.5 hover:cursor-pointer hover:bg-[#eee] dark:border-[#1b2e4b] dark:hover:bg-[#eee]/10">
                                            <div className="mt-0.5 text-primary ltr:mr-2 rtl:ml-2.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" fill="#fff" viewBox="0 0 512 512">
                                                    <path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 font-semibold">
                                                <h6 className="mb-1 text-base !text-white">Export Wallet</h6>
                                                <p className="text-xs">Need enable F2A</p>
                                            </div>
                                        </div>
                                        {/* <div className="group flex border-b border-white-light bg-primary px-4 py-2.5 text-white shadow-[0_1px_15px_1px_rgba(67,97,238,0.15)] hover:bg-[#eee] hover:text-black dark:border-[#1b2e4b] dark:hover:bg-[#eee]/10 dark:hover:text-white">
                                            <div className="mt-0.5 text-white group-hover:text-primary ltr:mr-2 rtl:ml-2.5">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                                    <path
                                                        opacity="0.5"
                                                        d="M4 10.1433C4 5.64588 7.58172 2 12 2C16.4183 2 20 5.64588 20 10.1433C20 14.6055 17.4467 19.8124 13.4629 21.6744C12.5343 22.1085 11.4657 22.1085 10.5371 21.6744C6.55332 19.8124 4 14.6055 4 10.1433Z"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                    ></path>
                                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"></circle>
                                                </svg>
                                            </div>
                                            <div className="flex-1 font-semibold">
                                                <h6 className="mb-1 text-base">Locations</h6>
                                                <p className="text-xs">25 New Travel Locations</p>
                                            </div>
                                        </div> */}
                                        <div className="flex px-4 py-2.5 hover:cursor-pointer hover:bg-[#eee] dark:hover:bg-[#eee]/10" onClick={() => signOut({ callbackUrl: '/' })}>
                                            <div className="mt-0.5 text-primary ltr:mr-2 rtl:ml-2.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" height="16" width="16" viewBox="0 0 512 512" fill="#e7515a">
                                                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 font-semibold">
                                                <h6 className="mb-1 text-base !text-danger">Logout</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </>
        )
    );
};

export default Index;
