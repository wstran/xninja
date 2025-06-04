import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { useEffect, useState } from 'react';
import { setPageTitle, toggleLocale, toggleRTL } from '../../store/themeConfigSlice';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import Dropdown from '@/components/Dropdown';
import { useTranslation } from 'react-i18next';
import { useAccount, useSignMessage } from "wagmi";
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { SiweMessage } from "siwe";
import { mainnet, base } from "viem/chains";
import { getCsrfToken, signIn, useSession } from "next-auth/react";

const ConnectBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Login Boxed'));
    });
    const router = useRouter();
    const session = useSession()
    const { address, isConnected } = useAccount();
    const { open } = useWeb3Modal();
    const { signMessageAsync } = useSignMessage();


    const submitForm = (e: any) => {
        e.preventDefault();
        router.push('/');
    };

    const handleSign = async () => {
        if (!isConnected) open();
        try {
            const message = new SiweMessage({
            domain: window.location.host,
            uri: window.location.origin,
            version: "1",
            address: address as `0x${string}`,
            statement: process.env.NEXT_PUBLIC_SIGNIN_MESSAGE,
            nonce: await getCsrfToken(),
            chainId: mainnet.id,
            });
  
            const signedMessage = await signMessageAsync({
            message: message.prepareMessage(),
            });
  
            const response = await signIn("web3", {
            message: JSON.stringify(message),
            signedMessage,
            redirect: true,
            callbackUrl: '/'
            });
            if (response?.error) {
            console.log("Error occured:", response.error);
            }
  
        } catch (error) {
            console.log("Error Occured", error);
        }
    };

    return (
        <div>
            <div className="relative flex items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h2 className="text-5xl font-semibold text-gray-400">Firstly,</h2>
                                <p className="text-xl text-gray-500 mt-2 mb-6">you <span className="font-extrabold text-gray-300">need</span> to</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <button 
                                    type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                    onClick={() => open()}
                                >
                                    Connect Wallet
                                </button>
                            </form>
                            <div className="relative my-7 text-center md:mb-9">
                                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">POWERED BY: Login.xyz</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
ConnectBoxed.getLayout = (page: any) => {
    return {page};
};
export default ConnectBoxed;
