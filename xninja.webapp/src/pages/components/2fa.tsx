import { useEffect, useLayoutEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import toast, { Toaster } from 'react-hot-toast';
import TwoFactAuth from './TwoFactAuth';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '../../store/themeConfigSlice';
import axiosApi from '../libs/axios';
import { signOut } from '../../hooks/useMeQuery';

export const FirstPage = ({ setPage }: { setPage: (page: string) => void }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setShowHeader(false));
    }, []);

    return (
        <>
            <div className="flex flex-col">
                <div className="p-5 flex">
                    <svg
                        onClick={() => {
                            setPage('');
                            dispatch(setShowHeader(true));
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill="#000"
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-col font-ibm">
                    <div className="flex w-full justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" height="150" width="150" viewBox="0 0 640 512" fill="#5c9bea">
                            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c1.8 0 3.5-.2 5.3-.5c-76.3-55.1-99.8-141-103.1-200.2c-16.1-4.8-33.1-7.3-50.7-7.3H178.3zm308.8-78.3l-120 48C358 277.4 352 286.2 352 296c0 63.3 25.9 168.8 134.8 214.2c5.9 2.5 12.6 2.5 18.5 0C614.1 464.8 640 359.3 640 296c0-9.8-6-18.6-15.1-22.3l-120-48c-5.7-2.3-12.1-2.3-17.8 0zM591.4 312c-3.9 50.7-27.2 116.7-95.4 149.7V273.8L591.4 312z" />
                        </svg>
                    </div>
                    <label className="text-xl font-bold text-center">Protect your account in just two steps</label>
                    <div className="flex mb-5 mt-5">
                        <div className="flex align-center text-xl font-bold text-[#000] bg-[#fff] rounded-full w-[26px] h-[26px] justify-center">1</div>
                        <div className="flex flex-col">
                            <label className={`ml-2 text-sm font-bold text-[#005]`}>Link an authentication app to your XNINJA account</label>
                            <span className="max-w-[500px]">
                                Use a compatible authentication app (like Google Authenticator, Authy, Duo Mobile, 1Password, etc.) We’ll generate a QR code for you to scan.
                            </span>
                        </div>
                    </div>
                    <div className="flex mb-5 mt-5">
                        <div className="flex align-center text-xl font-bold text-[#000] bg-[#fff] rounded-full w-[26px] h-[26px] justify-center">2</div>
                        <div className="flex flex-col">
                            <label className={`ml-2 text-sm font-bold 'text-[#005]'`}>Enter the confirmation code</label>
                            <span className="max-w-[500px]">Two-factor authentication will then be turned on for authentication app, which you can turn off at any time.</span>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button className="mt-5 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90" onClick={() => setPage('2fa_page_2')}>
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export const SecondPage = ({ reloadMe, setPage }: { reloadMe: () => void; setPage: (page: string) => void }) => {
    const [secret, setSecret] = useState('');
    const [dataUri, setDataUri] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setShowHeader(false));
    });

    useLayoutEffect(() => {
        axiosApi
            .post(`${import.meta.env.VITE_API_URL}/api/auth/two-factor/setup`)
            .then((response) => {
                setSecret(response.data.secret);
                setDataUri(response.data.dataUri);
            })
            .catch((error) => {
                if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
                    signOut(reloadMe);
                }
            });
    }, [reloadMe]);

    const [isCoppy, setIsCoppy] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        <>
            <div className="flex flex-col">
                <div className="p-5 flex">
                    <svg
                        onClick={() => {
                            setPage('2fa_page_1');
                            dispatch(setShowHeader(true));
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill="#000"
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-col font-ibm mt-5">
                    <label className="text-xl font-bold text-center">Protect your account in just two steps</label>
                    <div className="flex mb-5 mt-5 justify-center">
                        <div className="flex flex-col">
                            <span className="max-w-[500px] text-center">
                                Use a compatible authentication app (like Google Authenticator, Authy, Duo Mobile, 1Password, etc.) We’ll generate a QR code for you to scan.
                            </span>
                        </div>
                    </div>
                    <div className="flex mb-5 mt-5 justify-center">
                        <img src={dataUri} alt="" />
                    </div>
                    <div className="flex mb-5 mt-5 justify-center">
                        <div className="overflow-hidden flex border border-gray-700 rounded-lg h-12 w-full max-w-[400px]">
                            <p className={`'text-xs font-bold font-ibm ml-3 mt-3`}>{secret}</p>
                            <div className="flex w-full justify-end">
                                <div className="items-center justify-center flex text-white bg-dark hover:bg-dark/90 h-12 w-12 ml-2">
                                    <CopyToClipboard
                                        text={secret}
                                        onCopy={(text, result) => {
                                            if (result) setIsCoppy(true);
                                        }}
                                    >
                                        {isCoppy === true ? (
                                            <svg className="hover:cursor-pointer ltr:mr-2 ml-1 mb-1" fill="#fff" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
                                                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="hover:cursor-pointer ltr:mr-2 ml-1 mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button className="mt-5 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90" onClick={() => setPage('2fa_page_3')}>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export const ThirdPage = ({ reloadMe, setPage }: { reloadMe: () => void; setPage: (page: string) => void }) => {
    const [totpCode, setTotpCode] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setShowHeader(false));
    });

    useEffect(() => {
        toast.remove();
    }, []);

    const enable2FA = async () => {
        try {
            await axiosApi.post(`${import.meta.env.VITE_API_URL}/api/auth/two-factor/enable`, { totpCode });
            setPage('2fa_page_4');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 403) {
                    signOut(reloadMe);
                } else if (error.response.status === 400) {
                    toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                } else if (error.response.status === 500) {
                    toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                }
            }
        }
    };

    return (
        <>
            <div className="flex flex-col font-ibm">
                <div className="p-5 flex">
                    <svg
                        onClick={() => {
                            setPage('2fa_page_2');
                            dispatch(setShowHeader(true));
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill={'#000'}
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-col font-ibm mt-5">
                    <label className="text-xl font-bold text-center">Enter the confirmation code</label>
                    <div className="flex mt-5 justify-center">
                        <div className="flex flex-col">
                            <span className="max-w-[500px] text-center">Enter the Confirmation code that you get from the Authentication app below.</span>
                        </div>
                    </div>
                    <div className="flex mb-0 mt-5 justify-center">
                        <div className="overflow-hidden flex rounded-lg h-20 w-full max-w-[360px] flex-col">
                            <text className="mb-2">Enter your code to enable 2FA</text>
                            <TwoFactAuth value={totpCode} onChange={setTotpCode} />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            className="mt-5 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                            onClick={() => {
                                if (!totpCode.includes(' ')) {
                                    setTotpCode('');
                                    enable2FA();
                                } else {
                                    toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                                }
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
};

export const FourthPage = ({ setPage, reloadMe }: { setPage: (page: string) => void; reloadMe: () => void }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setShowHeader(false));
    });

    const [isCoppy, setIsCoppy] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        <>
            <div className="flex flex-col">
                <div className="p-5 flex">
                    <svg
                        onClick={() => {
                            setPage('');
                            dispatch(setShowHeader(true));
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill="#000"
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-col font-ibm">
                    <div className="flex w-full justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" height="150" width="150" viewBox="0 0 448 512" fill="#5c9bea">
                            <path d="M64 80c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V96c0-8.8-7.2-16-16-16H64zM0 96C0 60.7 28.7 32 64 32H384c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                        </svg>
                    </div>
                    <label className="text-xl font-bold mt-5 text-center">You’re all set</label>
                    <div className="flex mb-5 mt-2">
                        <div className="flex flex-col text-center">
                            <span className="max-w-[500px]">You have successfully set up two-factor authentication for your XNINJA account.</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            className="mt-2 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                            onClick={() => {
                                reloadMe();
                                setPage('');
                                dispatch(setShowHeader(true));
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export const Verify2FA = ({ reloadMe, onVerify }: { reloadMe: () => void; onVerify: (otp: string) => void }) => {
    const [totpCode, setTotpCode] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        toast.remove();
        dispatch(setShowHeader(false));
    });

    const verify2FA = async () => {
        try {
            await axiosApi.post(`${import.meta.env.VITE_API_URL}/api/auth/two-factor/verify`, { totpCode });
            onVerify(totpCode);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 403) {
                    signOut(reloadMe);
                } else if (error.response.status === 400) {
                    toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                } else if (error.response.status === 500) {
                    toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                }
            }
        }
    };

    return (
        <>
            <div className="flex flex-col">
                <div className="p-5 flex">
                    <svg
                        onClick={() => {
                            dispatch(setShowHeader(true));
                            onVerify('');
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill="#000"
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-col font-ibm mt-5">
                    <label className="text-xl font-bold text-center">Enter the confirmation code</label>
                    <div className="flex mt-5 justify-center">
                        <div className="flex flex-col">
                            <span className="max-w-[500px] text-center">Enter the Confirmation code that you get from the Authentication app.</span>
                        </div>
                    </div>
                    <div className="flex mb-0 mt-5 justify-center">
                        <div className="overflow-hidden flex rounded-lg h-20 w-full max-w-[360px] flex-col">
                            <TwoFactAuth value={totpCode} onChange={setTotpCode} />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            className="mt-5 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                            onClick={() => {
                                if (!totpCode.includes(' ') && totpCode.length === 6) {
                                    setTotpCode('');
                                    verify2FA();
                                } else {
                                    toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                                }
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
};
