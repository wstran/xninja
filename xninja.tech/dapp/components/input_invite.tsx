import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import React from 'react';
import { signOut } from 'next-auth/react';

export const Index = () => {
    const router = useRouter();
    const [referral_code, setInputInviteCode] = useState<string>('');

    useEffect(() => {
        toast.remove();
    }, []);

    return (
        <>
            <div className="mt-10 flex flex-col items-center">
                <div className="mb-5 flex w-full">
                    <div className="flex" onClick={() => signOut()}>
                        <svg className="mt-[2px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#e7515a">
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-base font-bold !text-danger`}>Logout</span>
                    </div>
                </div>
                <span className="text-center text-2xl font-bold">Import code</span>
                <span className="text-center text-sm font-bold">
                    You need a code to participate. If you don't have one, you can find a code on our{' '}
                    <a className="text-[#227fdd] underline" href="https://twitter.com/xninja_tech" target="_blank">
                        Twitter profile.
                    </a>
                </span>
                <input
                    type="text"
                    value={referral_code}
                    onChange={(e) => setInputInviteCode(e.target.value.replaceAll(' ', ''))}
                    placeholder="Enter invite code"
                    className="form-input mt-10 w-[370px] flex-1 rounded-full p-3 !bg-transparent"
                />
                <button
                    className="mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                    onClick={() => {
                        if (!referral_code || !referral_code.startsWith('xninja_')) {
                            toast.error('Code not found!', { duration: 3000, className: 'font-pixel text-black' });
                            return;
                        }

                        if (referral_code === 'xninja_invite') {
                            toast(
                                `A limited number of 2,000 Ninjas has already joined via this code.
                            Please find other codes in community of Ninjas in our X or discord.`,
                                { duration: 3000, className: 'font-pixel text-black' },
                            );
                            return;
                        }

                        axios
                            .post('/api/import_referral_code', { referral_code })
                            .then(() => router.reload())
                            .catch((error) => {
                                error.response.status === 403 && signOut({ callbackUrl: '/' });
                                error.response.status === 404 && toast.error('Code not found!', { duration: 3000, className: 'font-pixel text-black' });
                            });
                    }}
                >
                    Proceed
                </button>
            </div>
            <Toaster />
        </>
    );
};

export default Index;
