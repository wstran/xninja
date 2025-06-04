import { Fragment, ReactNode, useLayoutEffect, useState } from 'react';
import { signOut, useMeQuery } from '../hooks/useMeQuery';
import MyBag from './components/my_bag';
import { formatPriceNumber, roundDown } from './libs/custom';
import { Tab, Transition, Dialog } from '@headlessui/react';
import { Mana } from './components/svg';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { UpgradePanel } from './components/classes_gif';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import axiosApi from './libs/axios';

type PANEL_BOX = { children: ReactNode; hoverChildren: ReactNode };

const PanelBox = ({ children, hoverChildren }: PANEL_BOX) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    return (
        <div
            className="transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 m-0.5 w-[115px] h-[115px] bg-[#f5f5f4] rounded-md"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isHovered && hoverChildren}
            {children}
        </div>
    );
};

const Index = () => {
    const { data: user, coinlist, loadingCoinList, reload: reloadMe, loading } = useMeQuery('wallet addresses');
    const [wallet, setWallet] = useState<{ ELEM: number, INJ: number }>({ ELEM: 0, INJ: 0 });
    const [showBag, setShowBag] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    const [addModal, setModal] = useState<any>(false);
    const [params, setParams] = useState<any>({});
    const [activeModal, setActiveModal] = useState<boolean>(false);

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
                        onUse={() => navigate('/')}
                    />
                </div>
            )}
            <div className="xs:px-4 pt-4 pb-2 flex items-center overflow-y-auto border-b border-white-light font-ibm w-[375px] xxs:w-[430px] xs:w-[500px]">
                <div className="flex w-full justify-between">
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
                                    ) : wallet?.ELEM ? (
                                        formatPriceNumber(Number(roundDown(wallet.ELEM, 2)), 2)
                                    ) : (
                                        '0.00'
                                    )}
                                </span>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }}>
                                    $ELEM
                                </span>
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
                                    ) : wallet?.INJ ? (
                                        formatPriceNumber(Number(roundDown(wallet.INJ, 2)), 2)
                                    ) : (
                                        '0.00'
                                    )}
                                </span>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }}>
                                    $INJ
                                </span>
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
                                    <path
                                        d="M12.333 5.66667C12.333 6.55072 11.9818 7.39857 11.3567 8.02369C10.7315 8.64881 9.88369 9 8.99964 9C8.11558 9 7.26774 8.64881 6.64261 8.02369C6.01749 7.39857 5.6663 6.55072 5.6663 5.66667M2.02732 5.16782L1.44399 12.1678C1.31867 13.6716 1.25601 14.4235 1.51021 15.0035C1.73354 15.5131 2.12049 15.9336 2.60979 16.1985C3.1667 16.5 3.92119 16.5 5.43017 16.5H12.5691C14.0781 16.5 14.8326 16.5 15.3895 16.1985C15.8788 15.9336 16.2657 15.5131 16.4891 15.0035C16.7433 14.4235 16.6806 13.6716 16.5553 12.1678L15.972 5.16782C15.8641 3.87396 15.8102 3.22703 15.5237 2.73738C15.2714 2.3062 14.8957 1.9605 14.445 1.74487C13.9333 1.5 13.2841 1.5 11.9858 1.5L6.0135 1.5C4.71516 1.5 4.06598 1.5 3.55423 1.74487C3.10359 1.9605 2.72788 2.3062 2.47557 2.73738C2.18905 3.22703 2.13514 3.87396 2.02732 5.16782Z"
                                        stroke="black"
                                        strokeWidth="1.66667"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="text-xs text-[#78716C]" style={{ fontWeight: 400 }}>
                                    My Bag
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-1 h-8 mt-2 bg-[#f5f5f4] rounded-full max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                {
                    <Tab.Group>
                        <Tab.List className="flex justify-center space-x-4 !text-[#f6f6f6]">
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                                    font-ibm text-xs font-black text-black rounded-full h-6 w-36 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                    >
                                        Buy Chest
                                    </button>
                                )}
                            </Tab>
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                             font-ibm text-xs font-black text-black rounded-full h-6 w-36 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                    >
                                        Buy Food
                                    </button>
                                )}
                            </Tab>
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`${selected ? '!bg-#[f2f2f2] !outline-none shadow-[0_0px_5px_0_rgba(0,0,0,0.30)]' : ''}
                                               font-ibm text-xs font-black text-black rounded-full h-6 w-36 hover:!bg-[#f2f2f2] hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)]`}
                                    >
                                        Marketplace
                                    </button>
                                )}
                            </Tab>
                        </Tab.List>
                        {!showBag && (
                            <Tab.Panels>
                                <Tab.Panel>
                                    <div className="flex flex-wrap justify-center mt-5 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] overflow-y-auto scrollbar-hide">
                                        {Object.values(user.appConfig.data.CONFIG_CHESTS as { [key: string]: { price: number; level: number; chest: string; name: string; image: string } }).map(
                                            (value, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-1 py-1 m-0.5 w-[115px] h-[115px] bg-[#f5f5f4] rounded-md"
                                                        onClick={() =>
                                                            showDialog({
                                                                type: 'BUY_CHEST',
                                                                count: 1,
                                                                ...value,
                                                            })
                                                        }
                                                    >
                                                        <div className="flex items-center">
                                                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">
                                                                LV {value.level}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-full flex flex-col items-center">
                                                            <img className="w-16 mt-4" src={value.image} />
                                                            <div className="flex w-full mt-1 items-center justify-center">
                                                                <img className="w-4" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                <span className={`text-xs text-black font-ibm ml-1`}>{value.price === 0 ? 'Free' : formatPriceNumber(value.price)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <div className="flex flex-wrap justify-center mt-5 max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px] overflow-y-auto scrollbar-hide">
                                        {Object.values(user.appConfig.data.CONFIG_FOODS as { [key: string]: { price: number; mana: number; food: string; name: string; image: string } }).map(
                                            (value, index) => {
                                                return (
                                                    <PanelBox
                                                        key={index}
                                                        hoverChildren={
                                                            <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                                                <button
                                                                    className="btn bg-[#f5f5f4] text-black rounded-full font-ibm outline-none"
                                                                    onClick={() =>
                                                                        showDialog({
                                                                            type: 'BUY_FOOD',
                                                                            count: 1,
                                                                            ...value,
                                                                        })
                                                                    }
                                                                >
                                                                    Buy
                                                                </button>
                                                            </div>
                                                        }
                                                    >
                                                        <div className="w-full h-full flex flex-col items-center">
                                                            <div className="flex w-full justify-between">
                                                                <span className="inline-flex items-center px-[4px] w-[110px] text-[10px] font-medium font-ibm text-gray">{value.name}</span>
                                                                <div className="flex w-full items-center justify-end p-1">
                                                                    <img className="w-4" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                    <span className={`text-xs text-black font-ibm ml-1`}>{value.price}</span>
                                                                </div>
                                                            </div>
                                                            <img className="w-12 mt-2" src={value.image} />
                                                            <div className="flex mt-2">
                                                                {' '}
                                                                {Array.from({ length: value.mana }).map((_, index) => (
                                                                    <Mana key={index} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </PanelBox>
                                                );
                                            }
                                        )}
                                    </div>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <div className="mt-5 flex justify-center items-center">
                                        <img className="m-auto" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/hello-shop.gif" />
                                    </div>
                                </Tab.Panel>
                            </Tab.Panels>
                        )}
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
                                                        <div className="flex w-full items-center">
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
                                                            <span>Buy ({params.name})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-80 h-auto bg-white p-4 flex flex-col items-center">
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
                                                            onChange={(e) => {
                                                                const amount = Number(e.target.value);
                                                                amount && !isNaN(amount) && setParams((prev: any) => ({ ...prev, count: amount }));
                                                            }}
                                                            className="input rounded-full bg-transparent text-sm input-filled max-w-[60px] border-none text-center shadow-none outline-none"
                                                        />
                                                        <button
                                                            onClick={() => setParams((prev: any) => (prev.count < 1000 ? { ...prev, count: prev.count + 1 } : prev))}
                                                            className="gap-2 font-medium transition-all enabled:cursor-pointer enabled:active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-400 disabled:opacity-50 disabled:saturate-50 text-sm enabled:border-neutral-500 enabled:border enabled:bg-transparent enabled:hover:border-neutual-600 btn-normal m-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] p-2"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="flex bg-white w-full px-4 mt-2 justify-between">
                                                        <span className="font-ibm">Price</span>
                                                        <div className="flex items-center">
                                                            <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                            <span className="text-xs text-black font-ibm ml-1 truncate">{formatPriceNumber(Number(params.count * params.price))} ELEM</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-full px-4 mb-2 items-center">
                                                        <span className="font-ibm">Fee</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">0.0015</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-72 flex justify-center">
                                                        <button
                                                            className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                            disabled={activeModal}
                                                            onClick={() => {
                                                                setActiveModal(true);
                                                                if (params.food && params.count) {
                                                                    axiosApi
                                                                        .post(`${import.meta.env.VITE_API_URL}/api/markets/buy_food`, { food: params.food, count: params.count })
                                                                        .then((response) => {
                                                                            toast.success(`You have purchased ${params.count} ${params.name}.`, {
                                                                                duration: 3000,
                                                                                className: 'font-ibm text-xs',
                                                                            });
                                                                            setWallet((prev) => ({ ...prev, ...response.data }));
                                                                        })
                                                                        .catch((error) => {
                                                                            if (axios.isAxiosError(error) && error.response) {
                                                                                if (error.response.status === 403) {
                                                                                    signOut(reloadMe);
                                                                                } else if (error.response.status === 404) {
                                                                                    if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                                                        toast.error(`You don't have enough ELEM.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                    }
                                                                                    if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                                                        toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                    }
                                                                                    if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                                                        toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                    }
                                                                                } else if (error.response.status === 500) {
                                                                                    toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                }
                                                                            }
                                                                        })
                                                                        .finally(() => {
                                                                            setModal(false);
                                                                            setActiveModal(false);
                                                                        });
                                                                }
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
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">{formatPriceNumber(Number(params.count * params.price))} ELEM</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {params.type === 'BUY_CHEST' && (
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
                                                <div className="w-80 h-auto bg-white p-4 flex flex-col items-center">
                                                    <div className="justify-center mt-5 flex flex-col px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-3xl">
                                                        <img className={`w-20 ml-3 mb-2 ${activeModal ? 'animate-updown' : ''}`} src={params.image} />
                                                    </div>

                                                    <div className="flex bg-white px-4 mt-2 w-full justify-between">
                                                        <span className="font-ibm">Price</span>
                                                        <div className="flex items-center">
                                                            <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                            <span className="text-xs text-black font-ibm ml-1 truncate">
                                                                {params.price === 0 ? 'Free' : formatPriceNumber(Number(params.count * params.price)) + ' ELEM'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-full px-4 mb-2 items-center">
                                                        <span className="font-ibm">Fee</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">0.0015</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-72 flex justify-center">
                                                        <button
                                                            className="btn shadow-none outline-none rounded-full w-full hover:bg-[#f1f1f1] active:bg-[#f5f5f4]"
                                                            disabled={activeModal}
                                                            onClick={() => {
                                                                setActiveModal(true);
                                                                axiosApi
                                                                    .post(`${import.meta.env.VITE_API_URL}/api/markets/buy_chest`, { chest: params.chest })
                                                                    .then((response) => {
                                                                        setWallet((prev) => ({ ...prev, ...response.data.wallet }));
                                                                        showDialog({
                                                                            type: 'SHOW_NINJA',
                                                                            class: response.data.class,
                                                                            level: response.data.level,
                                                                            mana: response.data.mana,
                                                                        });
                                                                    })
                                                                    .catch((error) => {
                                                                        console.log(error)
                                                                        if (axios.isAxiosError(error) && error.response) {
                                                                            if (error.response.status === 403) {
                                                                                signOut(reloadMe);
                                                                            } else if (error.response.status === 404) {
                                                                                if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                                                    if (params.price === 0) {
                                                                                        toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                    } else {
                                                                                        toast.error(`You don't have enough ELEM.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                    }
                                                                                }
                                                                                if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                                                    toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                }
                                                                                if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                                                    toast.error(`Network busy!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                                }
                                                                            } else if (error.response.status === 500) {
                                                                                toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                                                            }
                                                                        }
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
                                                                <img className="w-6" src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`} alt="" />
                                                                <span className="text-xs text-black font-ibm ml-1 truncate">
                                                                    {params.price === 0 ? 'Free' : formatPriceNumber(Number(params.count * params.price)) + '  ELEM'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {params.type === 'SHOW_NINJA' && (
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
                                                <div className="w-80 h-auto bg-white p-4 flex flex-col items-center">
                                                    <div className="justify-center items-center mt-5 flex flex-col px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-3xl">
                                                        <div className="flex flex-col w-[100px] h-[100px] bg-[#f5f5f4] rounded-3xl">
                                                            <div className="flex">
                                                                <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-[4px] text-[10px] font-medium font-ibm text-gray">
                                                                    LV {params.level}
                                                                </span>
                                                            </div>
                                                            <UpgradePanel ninja_class={params.class} />
                                                        </div>
                                                    </div>

                                                    <div className="flex w-80 px-4 items-center">
                                                        <span className="font-ibm">Class</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <span className="font-ibm ml-1 truncate">{params.class[0].toUpperCase() + params.class.slice(1, params.class.length)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-80 px-4 items-center">
                                                        <span className="font-ibm">Level</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            <div className="flex items-center">
                                                                <span className="font-ibm truncate">{params.level}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex w-80 px-4 items-center">
                                                        <span className="font-ibm">Mana</span>
                                                        <div className="flex justify-end flex-1 overflow-hidden">
                                                            {
                                                                //@ts-ignore
                                                                Array.from({ length: user.appConfig.data.MANA_CLASSES[params.class] }).map((_, index) => (
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
    );
};

export default Index;
