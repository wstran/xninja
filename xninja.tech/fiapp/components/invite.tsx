import { IRootState } from '@/store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const Index = ({ backToProfile }: { backToProfile: () => void }) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const router = useRouter();
    //@ts-ignore
    const { data: session, status }: Seesion = useSession();
    const [isCoppy, setIsCoppy] = useState<boolean>(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        session && (
            <>
                <div className="flex flex-col">
                    <div className="mb-5 flex">
                        <svg
                            onClick={() => backToProfile()}
                            className="mt-1"
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
                    <div className="flex">
                        <div className="mr-20 flex flex-col">
                            <span className="text-base">Your invite</span>
                            <span className={`mt-4 text-center text-4xl font-bold ${themeConfig.theme === 'dark' ? 'text-white' : 'text-black'}`}>0</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base">Reward from Booster</span>
                            <span className={`mt-4 text-center text-4xl font-bold ${themeConfig.theme === 'dark' ? 'text-white' : 'text-black'}`}>0</span>
                        </div>
                    </div>
                    <div className="panel mt-10 flex w-full rounded-xl !bg-dark">
                        <span className="w-[50%] text-base text-white">Copy invite code</span>
                        <div className="flex w-full justify-end text-white">
                            <span className="font-lg mr-1">{session.user?.invite_code}</span>
                            <CopyToClipboard
                                text={session.user?.invite_code}
                                onCopy={(text, result) => {
                                    if (result) setIsCoppy(true);
                                }}
                            >
                                {isCoppy === true ? (
                                    <svg className="hover:cursor-pointer ltr:mr-2 rtl:ml-2" fill="#fff" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
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
                </div>
            </>
        )
    );
};

export default Index;
