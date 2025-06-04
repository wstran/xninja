import { Label, TextInput } from "flowbite-react";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";
import { ethers } from "ethers";
import axiosApi from "../libs/axios";
import { roundDown } from "../libs/custom";
import TwoFactAuth from "./TwoFactAuth";
import { BACKEND_API } from "@/config";

const customStyles = {
    control: (styles: any) => ({
        ...styles,
        backgroundColor: "white",
        borderColor: "gray-300",
        boxShadow: "none",
        "&:hover": {
            borderColor: "lightgray-300",
        },
    }),
    //@ts-ignore
    option: (styles, { isFocused, isSelected }) => {
        return {
            ...styles,
            backgroundColor: isFocused ? "lightgray-300" : "white",
            color: "gray-300",
            cursor: "pointer",
            ":active": {
                ...styles[":active"],
                backgroundColor: isSelected ? "gray-300" : "lightgray-300",
            },
        };
    },
    input: (provided: any) => ({
        ...provided,
        display: "none",
    }),
};

const SelectCoins = React.memo(
    ({
        coinlist,
        setSelectCoin,
    }: {
        coinlist: {
            id: number;
            token: string;
            balance: string;
            isLoading: boolean;
            icon: string;
            iconBackground: string;
        }[];
        setSelectCoin: (coin: string) => void;
    }) => {
        return (
            <div className="mx-auto">
                <div className="mb-2 block">
                    <Label
                        htmlFor="countries"
                        className="block mb-2 mt-4 text-sm font-bold text-gray-900/50"
                        value="Select token to withdraw"
                    />
                </div>
                <Select
                    className="outline-none block w-[400px] z-20 text-sm text-gray-600 font-ibm font-semibold bg-gray-50 rounded border border-gray-300"
                    classNamePrefix="select"
                    defaultValue={coinlist[0]}
                    isSearchable
                    name="coin"
                    options={coinlist}
                    styles={customStyles}
                    //@ts-ignore
                    getOptionLabel={(option) => (
                        <div className="flex ">
                            <img
                                alt=""
                                src={option.icon}
                                width={20}
                                height={20}
                                className="mr-[10px]"
                            />
                            {option.token} ({roundDown(option.balance, 2)})
                        </div>
                    )}
                    components={{
                        SingleValue: ({ data }) => (
                            <div className="flex">
                                <img
                                    alt=""
                                    src={data.icon}
                                    width={20}
                                    height={20}
                                    className="mr-[10px]"
                                />
                                {data.token}
                            </div>
                        ),
                    }}
                    onChange={(e) => e?.token && setSelectCoin(e.token)}
                    required
                />
            </div>
        );
    }
);

const Index = ({
    coinlist,
    setCoinlist,
    setPage,
    injectiveAddress,
}: {
    coinlist: {
        id: number;
        token: string;
        balance: string;
        isLoading: boolean;
        icon: string;
        iconBackground: string;
    }[];
    setCoinlist: (coins: {
        id: number;
        token: string;
        balance: string;
        isLoading: boolean;
        icon: string;
        iconBackground: string;
    }[]) => void;
    setPage: (page: string) => void;
    injectiveAddress: string;
}) => {
    const [selectCoin, setSelectCoin] = useState(coinlist[0].token);
    const [enterAddress, setEnterAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [sending, setSending] = useState(false);
    const [totpCode, setTotpCode] = useState('');

    useEffect(() => {
        toast.remove();
    }, []);

    return (
        <main
            className={`items-center h-[600px] bg-white justify-between no-scrollbar overflow-y-auto`}
        >
            <div className="flex items-center border-b border-white-light">
                <div className="p-4 flex">
                    <svg
                        onClick={() => {
                            setPage('');
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
            </div>
            <div
                className={`flex flex-col items-center bg-white text-black no-scrollbar overflow-y-auto font-ibm`}
            >
                <div className="flex items-center">
                    <SelectCoins coinlist={coinlist} setSelectCoin={setSelectCoin} />
                </div>

                <div className="mx-auto mt-4">
                    <label className="block mb-2 text-sm font-bold text-gray-900/50">
                        ENTER RECIPIENT ADDRESS (Injective network only)
                    </label>
                    <form className="mx-auto flex w-[400px]">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-gray-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 512 512"
                                >
                                    <path d="M384 48c8.8 0 16 7.2 16 16V448c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16H384zM96 0C60.7 0 32 28.7 32 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H96zM240 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128zm-32 32c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80H208zM512 80c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V80zM496 192c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm16 144c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V336z" />
                                </svg>
                            </div>
                            <TextInput
                                onChange={(e) => setEnterAddress(e.target.value)}
                                value={enterAddress}
                                type="text"
                                placeholder="Enter Address"
                                required
                                style={{ outline: "none" }}
                                className="block p-2.5 w-full z-20 ps-10 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-300 font-ibm"
                            />
                        </div>
                    </form>
                </div>

                <div className="mx-auto mt-4">
                    <div className="flex justify-between">
                        <label className="block mb-2 text-sm font-bold text-gray-900/50">
                            Enter amount
                        </label>
                        <label htmlFor="collateral" className="text-sm font-semibold text-gray-900/70">
                            Available: {(() => {
                                const coin = coinlist.find(i => i.token === selectCoin);

                                return roundDown(coin?.balance || '0', 2);
                            })()} {selectCoin}
                        </label>
                    </div>
                    <form className="mx-auto flex">
                        <div className="relative w-[400px] border border-gray-300 rounded-xl bg-gray-50">
                            <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-gray-500 outline-none block"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1M2 5h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm8 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="outline-none block p-2.5 z-20 ps-10 text-sm text-gray-600 font-semibold bg-gray-50 rounded-xl"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) =>
                                    !isNaN(Number(e.target.value)) && setAmount(e.target.value)
                                }
                                required
                            />
                            <div className="inset-y-0 end-0 top-0 absolute flex items-center ps-3.5">
                                <span onClick={() => {
                                    const token = coinlist.find(value => value.token === selectCoin);
                                    const convertAmount = Number(roundDown(token?.balance || '0', 2, true));
                                    const amount = convertAmount > 0 ? convertAmount : 0;
                                    token && setAmount(String(amount));
                                }} className="hover:cursor-pointer inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">Max</span>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mx-auto mt-4">
                    <div className="flex">
                        <label className="block mb-2 text-sm font-bold text-gray-900/50">
                            Enter memo
                        </label>
                    </div>
                    <form className="mx-auto flex">
                        <div className="relative w-[400px] border border-gray-300 rounded-xl bg-gray-50">
                            <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                                <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-4 h-4 opacity-[0.6] text-gray-500 outline-none block">
                                        <path d="M64 128V96h64l0 320H96c-17.7 0-32 14.3-32 32s14.3 32 32 32H224c17.7 0 32-14.3 32-32s-14.3-32-32-32H192l0-320h64v32c0 17.7 14.3 32 32 32s32-14.3 32-32V80c0-26.5-21.5-48-48-48H160 48C21.5 32 0 53.5 0 80v48c0 17.7 14.3 32 32 32s32-14.3 32-32zM502.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8h32V352H416c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8H512V160h32c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-64-64z" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                type="text"
                                className="outline-none block p-2.5 z-20 ps-10 text-sm text-gray-600 font-semibold bg-gray-50 rounded-xl"
                                placeholder="Enter memo"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                required
                            />
                        </div>
                    </form>
                    <p className="text-danger text-xs font-ibm py-2 max-w-[400px]">(*)Please note that sending INJ to a centralized exchange (CEX) requires a memo.</p>
                </div>

                <div className="flex flex-col font-ibm mt-4">
                    <label className="text-xl font-bold text-center">Enter 2FA Code</label>
                    <div className="flex mb-0 mt-4 justify-center">
                        <div className="overflow-hidden flex rounded-lg h-20 w-full max-w-[360px] flex-col">
                            <TwoFactAuth value={totpCode} onChange={setTotpCode} />
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-4 flex justify-center">
                    <button
                        disabled={sending}
                        type="button"
                        className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 mb-4 py-2.5 justify-center inline-flex items-center disabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-[0.8]"
                        onClick={() => {
                            if (enterAddress.length !== 42) {
                                toast.error("Please enter your address to withdraw!", {
                                    duration: 3000,
                                    className: "font-ibm text-xs",
                                });
                                return;
                            }

                            if (injectiveAddress.toLowerCase() === enterAddress.toLowerCase()) {
                                toast.error("You cannot withdraw to the same wallet address!", {
                                    duration: 3000,
                                    className: "font-ibm text-xs",
                                });
                                return;
                            };

                            if (!amount || Number(amount) === 0) {
                                toast.error("Please enter amount to withdraw!", {
                                    duration: 3000,
                                    className: "font-ibm text-xs",
                                });
                                return;
                            }

                            if (isNaN(Number(amount)) || Number(amount) < 0) {
                                toast.error("Invalid amount!", {
                                    duration: 3000,
                                    className: "font-ibm text-xs",
                                });
                                return;
                            }

                            setSending(true);

                            if (!totpCode.includes(' ') && totpCode.length === 6) {
                                axiosApi
                                    .post(
                                        `${BACKEND_API}/api/blockchain/withdraw`,
                                        {
                                            recipient: enterAddress,
                                            amount: Number(amount),
                                            token: selectCoin,
                                            totpCode,
                                            memo,
                                        }
                                    )
                                    .then(() => {
                                        axiosApi
                                            .get(`${BACKEND_API}/api/blockchain/fetch-balance`, {
                                                params: { injectiveAddress },
                                            })
                                            .then((response) => {
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

                                                setAmount('');
                                                setMemo('');

                                                setTimeout(() => toast.success("Successful withdrawal!", {
                                                    duration: 3000,
                                                    className: "font-ibm text-xs",
                                                }), 200);
                                            })
                                            .catch((error) => {
                                                console.error('Error fetching balances', error);
                                            })
                                            .finally(() => {
                                                setTotpCode('');
                                                setSending(false);
                                            });
                                    })
                                    .catch((error) => {
                                        error.response.status === 403 && setPage('');
                                        if (error.response.status === 403 && error.response.data?.status === 'SAME_ADDRESS') {
                                            toast.error("You cannot withdraw to the same wallet address!", {
                                                duration: 3000,
                                                className: "font-ibm text-xs",
                                            });
                                        } else if (error.response.status === 404) {
                                            if (error.response.data.status === 'NOT_ENOUGH_GAS') {
                                                toast.error(`You don't have enough fees.`, { duration: 3000, className: 'font-ibm text-xs' });
                                            } else if (error.response.data.status === 'NOT_ENOUGH_MONEY') {
                                                toast.error(`You don't have enough ${selectCoin} to withdraw`, { duration: 3000, className: 'font-ibm text-xs' });
                                            } else if (error.response.data.status === 'SOMETHING_WENT_WRONG') {
                                                toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                            };
                                        } else if (error.response.status === 400) {
                                            toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                                        } else if (error.response.status === 500) {
                                            toast.error(`Sorry something went wrong!`, { duration: 3000, className: 'font-ibm text-xs' });
                                        };
                                        setTotpCode('');
                                        setSending(false);
                                    });
                            } else {
                                setTotpCode('');
                                setSending(false);
                                toast.error('Your 2FA code is not valid!', { duration: 3000, className: 'font-ibm text-xs' });
                            };
                        }}
                    >
                        {sending && (
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
                        <span className="text-center items-center font-semibold">
                            Withdraw
                        </span>
                        <svg
                            className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 10"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 5h12m0 0L9 1m4 4L9 9"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <Toaster />
        </main>
    );
};

export default Index;
