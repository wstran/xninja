import { IRootState } from '@/store';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowHeader } from '@/store/themeConfigSlice';
import CopyToClipboard from 'react-copy-to-clipboard';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { signOut } from 'next-auth/react';

const Index = ({ setPage }: { setPage: (page: string) => void }) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [privateKey, setPrivateKey] = useState('');

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setShowHeader(false));
    });

    useEffect(() => {
        toast.remove();
    }, []);

    useLayoutEffect(() => {
        axios
            .post('/api/profiles/export-wallet')
            .then((response) => setPrivateKey(response.data))
            .catch((error) => {
                if (error.response.status === 403) {
                    signOut({ callbackUrl: '/' });
                    return;
                }
                toast.error('Sorry something went wrong!', { duration: 3000, className: 'font-pixel text-black' });
            });
    }, []);

    const [isCoppy, setIsCoppy] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        privateKey && (
            <>
                <div className="flex flex-col">
                    <div className="mb-5 flex">
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
                            fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}
                        >
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-xl font-bold ${themeConfig.theme === 'dark' ? 'text-white' : 'text-black'}`}>Back</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex w-full justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" height="120" width="120" fill="#5c9bea" viewBox="0 0 448 512">
                                <path d="M224 64c-44.2 0-80 35.8-80 80v48H384c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80V144C80 64.5 144.5 0 224 0c57.5 0 107 33.7 130.1 82.3c7.6 16 .8 35.1-15.2 42.6s-35.1 .8-42.6-15.2C283.4 82.6 255.9 64 224 64zm32 320c17.7 0 32-14.3 32-32s-14.3-32-32-32H192c-17.7 0-32 14.3-32 32s14.3 32 32 32h64z" />
                            </svg>
                        </div>
                        <div className="flex w-full justify-center mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512" fill={themeConfig.theme === 'dark' ? '#fff' : '#000'}>
                                <path d="M208 32c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V172.9l122-70.4c15.3-8.8 34.9-3.6 43.7 11.7l16 27.7c8.8 15.3 3.6 34.9-11.7 43.7L352 256l122 70.4c15.3 8.8 20.5 28.4 11.7 43.7l-16 27.7c-8.8 15.3-28.4 20.6-43.7 11.7L304 339.1V480c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V339.1L86 409.6c-15.3 8.8-34.9 3.6-43.7-11.7l-16-27.7c-8.8-15.3-3.6-34.9 11.7-43.7L160 256 38 185.6c-15.3-8.8-20.5-28.4-11.7-43.7l16-27.7C51.1 98.8 70.7 93.6 86 102.4l122 70.4V32z" />
                            </svg>
                        </div>
                        <label className={`mt-5 text-sm font-bold ${themeConfig.theme === 'dark' ? 'text-[#fff]' : 'text-[#005]'}`}>Take control of your xNinja account in two simple steps</label>
                        <div className="flex mb-5 mt-5">
                            <div className="flex align-center text-xl font-bold text-[#000] bg-[#fff] rounded-full w-[26px] h-[26px] justify-center">1</div>
                            <div className="flex flex-col">
                                <label className={`ml-2 mt-1 text-sm font-bold ${themeConfig.theme === 'dark' ? 'text-[#fff]' : 'text-[#005]'}`}>Copy your private key.</label>
                            </div>
                        </div>
                        <div className="flex mb-5 mt-5">
                            <div className="flex align-center text-xl font-bold text-[#000] bg-[#fff] rounded-full w-[26px] h-[26px] justify-center">2</div>
                            <div className="flex flex-col">
                                <label className={`ml-2 mt-1 text-sm font-bold ${themeConfig.theme === 'dark' ? 'text-[#fff]' : 'text-[#005]'}`}>
                                    Import your key into{' '}
                                    <a className="text-[#4A99D9]" href="https://www.keplr.app/download" target="_blank">
                                        Keplr Wallet.
                                    </a>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <CopyToClipboard
                                text={privateKey}
                                onCopy={(text, result) => {
                                    if (result) setIsCoppy(true);
                                }}
                            >
                                <div className="mt-5 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90">
                                    <div className="flex justify-center hover:cursor-pointer mt-1">
                                        {isCoppy === true ? (
                                            <svg className="ltr:mr-2 ml-1 mb-1" fill="#fff" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
                                                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="ltr:mr-2 ml-1 mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                        Copy Key
                                    </div>
                                </div>
                            </CopyToClipboard>
                        </div>
                        <div className="flex mt-5">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 512 512" fill="#5c9bea">
                                <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
                            </svg>
                            <span className={`ml-2 text-sm font-bold text-[#4A99D9] max-w-[350px]`}>
                                Never share your private key with anyone! It controls your account. Note: Your private key is securely encrypted by a 3rd-party service, and we can’t access it
                            </span>
                        </div>
                    </div>
                </div>
                <Toaster />
            </>
        )
    );
};

export default Index;
