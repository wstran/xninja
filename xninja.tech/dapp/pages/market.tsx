import { getSession, signOut, useSession } from 'next-auth/react';
import { Login } from './login';
import Database from '@/libs/database';
import { JWT } from 'next-auth/jwt';
import { GetServerSidePropsContext } from 'next';
import InvitePage from '@/components/input_invite';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '@/store/themeConfigSlice';
import React, { Fragment, ReactNode, useEffect, useState } from 'react';
import { Tab, Transition, Dialog } from '@headlessui/react';
import { Mana } from '@/components/svg';
import axios from 'axios';
import { CONFIG_FOODS, CONFIG_CHESTS, MANA_CLASSES } from '@/libs/game.config';
import toast, { Toaster } from 'react-hot-toast';
import MyBag from '@/components/my_bag';
import { useRouter } from 'next/router';
import { formatPriceNumber } from '@/libs/custom';
import { UpgradePanel } from '@/components/classes_gif';

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

type PANEL_BOX = { children: ReactNode; hoverChildren: ReactNode };

const PanelBox = ({ children, hoverChildren }: PANEL_BOX) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    return (
        <div
            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isHovered && hoverChildren}
            {children}
        </div>
    );
};

const Index = ({ serverStatus }: { serverStatus: number }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    //@ts-ignore
    const { data: session, status }: Seesion = useSession();

    const [wallet, setWallet] = useState(session?.user?.wallet);

    const [showBag, setShowBag] = useState<boolean>(false);

    useEffect(() => {
        toast.remove();

        dispatch(setShowHeader(true));

        //@ts-ignore
        getSession().then((session: Seesion) => setWallet(session?.user?.wallet || { ELEM: 0 }));
    }, []);

    const [addModal, setModal] = useState<any>(false);
    const [params, setParams] = useState<any>({});
    const [activeModal, setActiveModal] = useState<boolean>(false);

    const showDialog = (data: any) => {
        setParams(data);
        setModal(true);
    };

    if (serverStatus === 202) {
        dispatch(setShowHeader(false));
        return <InvitePage />;
    }

    if (serverStatus === 403) return <Login />;

    if (status !== 'loading' && (status === 'unauthenticated' || !session)) return <Login />;

    return (
        status === 'authenticated' &&
        session && (
            <>
                {showBag && (
                    <div className="w-full h-full max-h-[800px] max-w-[500px] bg-white absolute z-10">
                        <MyBag closeBag={() => setShowBag(false)} onUse={() => router.push('/')} />
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
                <div className="p-1 h-8 bg-[#f5f5f4] rounded-full">
                    {
                        <Tab.Group>
                            <Tab.List className="flex justify-center space-x-3 flex !text-[#f6f6f6]">
                                <Tab as={Fragment}>
                                    {({ selected }) => (
                                        <button
                                            className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                                    font-pixel text-xs font-black text-black rounded-full h-6 w-28 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                        >
                                            Buy Chest
                                        </button>
                                    )}
                                </Tab>
                                <Tab as={Fragment}>
                                    {({ selected }) => (
                                        <button
                                            className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                             font-pixel text-xs font-black text-black rounded-full h-6 w-28 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                        >
                                            Buy Food
                                        </button>
                                    )}
                                </Tab>
                                <Tab as={Fragment}>
                                    {({ selected }) => (
                                        <button
                                            className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                               font-pixel text-xs font-black text-black rounded-full h-6 w-28 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                        >
                                            Marketplace
                                        </button>
                                    )}
                                </Tab>
                            </Tab.List>
                            <Tab.Panels>
                                <Tab.Panel>
                                    <div className="flex flex-wrap mt-5 max-w-[375px] overflow-y-auto scrollbar-hide">
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                    LV {CONFIG_CHESTS.ninja_chest.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-16 mt-2" src={CONFIG_CHESTS.ninja_chest.image} />
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>
                                                        {CONFIG_CHESTS.ninja_chest.price === 0 ? 'Free' : formatPriceNumber(CONFIG_CHESTS.ninja_chest.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                    LV {CONFIG_CHESTS.warrior_chest.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-16 mt-2" src={CONFIG_CHESTS.warrior_chest.image} />
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>
                                                        {CONFIG_CHESTS.warrior_chest.price === 0 ? 'Free' : formatPriceNumber(CONFIG_CHESTS.warrior_chest.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                    LV {CONFIG_CHESTS.knight_chest.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-16 mt-2" src={CONFIG_CHESTS.knight_chest.image} />
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>
                                                        {CONFIG_CHESTS.knight_chest.price === 0 ? 'Free' : formatPriceNumber(CONFIG_CHESTS.knight_chest.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                    LV {CONFIG_CHESTS.lord_chest.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-16 mt-2" src={CONFIG_CHESTS.lord_chest.image} />
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>
                                                        {CONFIG_CHESTS.lord_chest.price === 0 ? 'Free' : formatPriceNumber(CONFIG_CHESTS.lord_chest.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                    LV {CONFIG_CHESTS.master_chest.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-16 mt-2" src={CONFIG_CHESTS.master_chest.image} />
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>
                                                        {CONFIG_CHESTS.master_chest.price === 0 ? 'Free' : formatPriceNumber(CONFIG_CHESTS.master_chest.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <div className="flex flex-wrap mt-5 max-w-[375px] overflow-y-auto scrollbar-hide">
                                        <PanelBox
                                            hoverChildren={
                                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                                    <button
                                                        className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none"
                                                        onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                                    >
                                                        Buy
                                                    </button>
                                                </div>
                                            }
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-12 mt-2" src={CONFIG_FOODS.rice.image} />
                                                <div className="flex mt-2">
                                                    {' '}
                                                    {Array.from({ length: CONFIG_FOODS.rice.mana }).map((_, index) => (
                                                        <Mana key={index} />
                                                    ))}
                                                </div>
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>{CONFIG_FOODS.rice.price}</span>
                                                </div>
                                            </div>
                                        </PanelBox>
                                        <PanelBox
                                            hoverChildren={
                                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                                    <button
                                                        className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none"
                                                        onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                                    >
                                                        Buy
                                                    </button>
                                                </div>
                                            }
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-12 mt-4" src={CONFIG_FOODS.miso_soup.image} />
                                                <div className="flex">
                                                    {' '}
                                                    {Array.from({ length: CONFIG_FOODS.miso_soup.mana }).map((_, index) => (
                                                        <Mana key={index} />
                                                    ))}
                                                </div>
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>{CONFIG_FOODS.miso_soup.price}</span>
                                                </div>
                                            </div>
                                        </PanelBox>
                                        <PanelBox
                                            hoverChildren={
                                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                                    <button
                                                        className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none"
                                                        onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                                    >
                                                        Buy
                                                    </button>
                                                </div>
                                            }
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-14" src={CONFIG_FOODS.meat.image} />
                                                <div className="flex mt-2">
                                                    {' '}
                                                    {Array.from({ length: CONFIG_FOODS.meat.mana }).map((_, index) => (
                                                        <Mana key={index} />
                                                    ))}
                                                </div>
                                                <div className="flex w-full mt-1 items-center justify-center">
                                                    <img className="w-4" src={`/assets/images/ELEM.png`} alt="" />
                                                    <span className={`text-xs text-black font-pixel ml-1`}>{CONFIG_FOODS.meat.price}</span>
                                                </div>
                                            </div>
                                        </PanelBox>
                                    </div>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <div className="flex flex-wrap mt-5 max-w-[375px] overflow-y-auto scrollbar-hide">
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-8 mt-6" src={'/assets/ninjas/metal.png'} />
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-10 mt-6" src={'/assets/ninjas/water.png'} />
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-9 mt-6" src={'/assets/ninjas/fire.png'} />
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-12 mt-6" src={'/assets/ninjas/wood.png'} />
                                            </div>
                                        </div>
                                        <div
                                            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
                                            onClick={() => toast(`Available on Mainnet!`, { duration: 3000, className: 'font-pixel text-black' })}
                                        >
                                            <div className="w-full h-full flex flex-col items-center">
                                                <img className="w-12 mt-6" src={'/assets/ninjas/earth.png'} />
                                            </div>
                                        </div>
                                    </div>
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    }
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
                                            {params.type === 'BUY_FOOD' && (
                                                <>
                                                    <div className="flex flex-col border-b border-white-light font-semibold">
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
                                                            <div className="flex items-center">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path
                                                                        d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.3284 5 13.7426 5.87868 14.6213C6.75736 15.5 8.17157 15.5 11 15.5H19"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                        strokeLinecap="round"
                                                                    />
                                                                    <path
                                                                        d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                    <path
                                                                        d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                    <path d="M11 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                    <path
                                                                        d="M5 6H16.4504C18.5054 6 19.5328 6 19.9775 6.67426C20.4221 7.34853 20.0173 8.29294 19.2078 10.1818L18.7792 11.1818C18.4013 12.0636 18.2123 12.5045 17.8366 12.7523C17.4609 13 16.9812 13 16.0218 13H5"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                </svg>
                                                                Buy Food
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-80 h-auto mb-10 flex flex-col items-center">
                                                        <div className="justify-center mt-5 flex flex-col px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-3xl">
                                                            <img className="w-16 ml-5 mb-2" src={params.image} />
                                                        </div>
                                                        <div className="justify-center mt-5 flex">
                                                            <button
                                                                onClick={() => setParams((prev: any) => (prev.count > 1 ? { ...prev, count: prev.count - 1 } : prev))}
                                                                className="gap-2 font-medium transition-all enabled:cursor-pointer enabled:active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-400 disabled:opacity-50 disabled:saturate-50 text-sm enabled:border-neutral-500 enabled:border enabled:bg-transparent enabled:hover:border-neutual-600 btn-normal m-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] p-2"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="text"
                                                                max="1000"
                                                                value={params.count}
                                                                className="input rounded-full bg-transparent text-sm input-filled max-w-[60px] border-none text-center shadow-none outline-none"
                                                            />
                                                            <button
                                                                onClick={() => setParams((prev: any) => (prev.count < 1000 ? { ...prev, count: prev.count + 1 } : prev))}
                                                                className="gap-2 font-medium transition-all enabled:cursor-pointer enabled:active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-400 disabled:opacity-50 disabled:saturate-50 text-sm enabled:border-neutral-500 enabled:border enabled:bg-transparent enabled:hover:border-neutual-600 btn-normal m-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] p-2"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <div className="flex w-80 p-4 items-center">
                                                            <span className="font-pixel">Price</span>
                                                            <div className="flex justify-end flex-1 overflow-hidden">
                                                                <div className="flex items-center">
                                                                    <img className="w-6" src={`/assets/images/ELEM.png`} alt="" />
                                                                    <span className="text-xs text-black font-pixel ml-1 truncate">{formatPriceNumber(Number(params.count * params.price))}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-72 flex justify-center">
                                                            <button
                                                                className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setActiveModal(true);
                                                                    axios
                                                                        .post('/api/market/buy_food', { food: params.food, count: params.count })
                                                                        .then((response) => {
                                                                            setWallet(response.data);
                                                                            toast.success(`You have purchased ${params.count} ${params.name}.`, { duration: 3000, className: 'font-pixel text-black' });
                                                                        })
                                                                        .catch((error) => {
                                                                            error.response.status === 403 && signOut({ callbackUrl: '/' });
                                                                            error.response.status === 404 &&
                                                                                error.response.data.status === 'NOT_ENOUGH_MONEY' &&
                                                                                toast.error(`You don't have enough $ELEM.`, { duration: 3000, className: 'font-pixel text-black' });
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
                                                                Buy for{' '}
                                                                <div className="flex items-center ml-1">
                                                                    <img className="w-6" src={`/assets/images/ELEM.png`} alt="" />
                                                                    <span className="text-xs text-black font-pixel ml-1 truncate">{formatPriceNumber(Number(params.count * params.price))}</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {params.type === 'BUY_CHEST' && (
                                                <>
                                                    <div className="flex flex-col border-b border-white-light font-semibold">
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
                                                            <div className="flex items-center">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path
                                                                        d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.3284 5 13.7426 5.87868 14.6213C6.75736 15.5 8.17157 15.5 11 15.5H19"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                        strokeLinecap="round"
                                                                    />
                                                                    <path
                                                                        d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                    <path
                                                                        d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                    <path d="M11 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                    <path
                                                                        d="M5 6H16.4504C18.5054 6 19.5328 6 19.9775 6.67426C20.4221 7.34853 20.0173 8.29294 19.2078 10.1818L18.7792 11.1818C18.4013 12.0636 18.2123 12.5045 17.8366 12.7523C17.4609 13 16.9812 13 16.0218 13H5"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                    />
                                                                </svg>
                                                                Buy Chest LV {params.level}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-80 h-auto mb-10 flex flex-col items-center">
                                                        <div className="justify-center mt-5 flex flex-col px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-3xl">
                                                            <img className={`w-20 ml-3 mb-2 ${activeModal ? 'animate-updown' : ''}`} src={params.image} />
                                                        </div>

                                                        <div className="flex w-80 p-4 items-center">
                                                            <span className="font-pixel">Price</span>
                                                            <div className="flex justify-end flex-1 overflow-hidden">
                                                                <div className="flex items-center">
                                                                    <img className="w-6" src={`/assets/images/ELEM.png`} alt="" />
                                                                    <span className="text-xs text-black font-pixel ml-1 truncate">
                                                                        {params.price === 0 ? 'Free' : formatPriceNumber(Number(params.count * params.price))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-72 flex justify-center">
                                                            <button
                                                                className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setActiveModal(true);
                                                                    axios
                                                                        .post('/api/market/buy_chest', { chest: params.chest })
                                                                        .then((response) => {
                                                                            setWallet({ ELEM: response.data.ELEM });
                                                                            showDialog({
                                                                                type: 'SHOW_NINJA',
                                                                                class: response.data.class,
                                                                                level: response.data.level,
                                                                                mana: response.data.mana,
                                                                            });
                                                                        })
                                                                        .catch((error) => {
                                                                            error.response.status === 403 && signOut({ callbackUrl: '/' });
                                                                            error.response.status === 404 &&
                                                                                error.response.data.status === 'NOT_ENOUGH_MONEY' &&
                                                                                toast.error(`You don't have enough $ELEM.`, { duration: 3000, className: 'font-pixel text-black' });

                                                                            setModal(false);
                                                                        })
                                                                        .finally(() => setActiveModal(false));
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
                                                                Buy for{' '}
                                                                <div className="flex items-center ml-1">
                                                                    <img className="w-6" src={`/assets/images/ELEM.png`} alt="" />
                                                                    <span className="text-xs text-black font-pixel ml-1 truncate">
                                                                        {params.price === 0 ? 'Free' : formatPriceNumber(Number(params.count * params.price))}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {params.type === 'SHOW_NINJA' && (
                                                <>
                                                    <div className="flex flex-col border-b border-white-light font-semibold">
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
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        clipRule="evenodd"
                                                                        d="M12.858 20H10.221C6.3456 20 4.40789 20 3.20394 18.8284C2 17.6569 2 15.7712 2 12C2 8.22876 2 6.34315 3.20394 5.17157C4.40789 4 6.34561 4 10.221 4H12.858C15.0854 4 16.1992 4 17.1289 4.50143C18.0586 5.00286 18.6488 5.92191 19.8294 7.76001L20.5102 8.82001C21.5034 10.3664 22 11.1396 22 12C22 12.8604 21.5034 13.6336 20.5102 15.18L19.8294 16.24C18.6488 18.0781 18.0586 18.9971 17.1289 19.4986C16.1992 20 15.0854 20 12.858 20ZM7 7.05423C7.41421 7.05423 7.75 7.37026 7.75 7.76011V16.2353C7.75 16.6251 7.41421 16.9412 7 16.9412C6.58579 16.9412 6.25 16.6251 6.25 16.2353V7.76011C6.25 7.37026 6.58579 7.05423 7 7.05423Z"
                                                                        fill="currentColor"
                                                                    />
                                                                </svg>
                                                                You have purchased 1 {params.class[0].toUpperCase() + params.class.slice(1, params.class.length)} Ninja.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-80 h-auto mb-10 flex flex-col items-center">
                                                        <div className="justify-center items-center mt-5 flex flex-col px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-3xl">
                                                            <div className="flex flex-col w-[100px] h-[100px] bg-[#f5f5f4] rounded-3xl">
                                                                <div className="flex">
                                                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-pixel text-gray">
                                                                        LV {params.level}
                                                                    </span>
                                                                </div>
                                                                <UpgradePanel ninja_class={params.class} />
                                                            </div>
                                                        </div>

                                                        <div className="flex w-80 px-4 items-center">
                                                            <span className="font-pixel">Class</span>
                                                            <div className="flex justify-end flex-1 overflow-hidden">
                                                                <div className="flex items-center">
                                                                    <span className="font-pixel ml-1 truncate">{params.class[0].toUpperCase() + params.class.slice(1, params.class.length)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex w-80 px-4 items-center">
                                                            <span className="font-pixel">Level</span>
                                                            <div className="flex justify-end flex-1 overflow-hidden">
                                                                <div className="flex items-center">
                                                                    <span className="font-pixel truncate">{params.level}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex w-80 px-4 items-center">
                                                            <span className="font-pixel">Mana</span>
                                                            <div className="flex justify-end flex-1 overflow-hidden">
                                                                {
                                                                    //@ts-ignore
                                                                    Array.from({ length: MANA_CLASSES[params.class] }).map((_, index) => (
                                                                        <Mana key={index} />
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="w-72 flex justify-center mt-2">
                                                            <button
                                                                className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                                disabled={activeModal}
                                                                onClick={() => {
                                                                    setModal(false);
                                                                    setActiveModal(false);
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
        )
    );
};

export default Index;