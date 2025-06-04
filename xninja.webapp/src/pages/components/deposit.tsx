import { Label, TextInput } from "flowbite-react";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Select from "react-select";
import { Toaster } from "react-hot-toast";
import { roundDown } from "../libs/custom";
import CopyToClipboard from "react-copy-to-clipboard";
import qrcode from 'qrcode';

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
                        value="Select token to deposit"
                    />
                </div>
                <Select
                    className="outline-none block w-[365px] xxs:w-[420px] xs:w-[500px] z-20 text-sm text-gray-600 font-ibm font-semibold bg-gray-50 rounded border border-gray-300"
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
                                {data.token} ({roundDown(data.balance, 2)})
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
    const [_, setSelectCoin] = useState(coinlist[0].token);
    const [isCoppy, setIsCoppy] = useState<boolean>(false);
    const [dataUri, setDataUri] = useState('');

    useLayoutEffect(() => {
        (async () => setDataUri(await qrcode.toDataURL(injectiveAddress, { errorCorrectionLevel: 'H' })))();
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
            <div
                className={`h-[600px] w-[365px] xxs:w-[420px] xs:w-[500px] bg-white text-black no-scrollbar overflow-y-auto font-ibm`}
            >
                <div className="flex items-center border-b border-white-light">
                    <div className="p-5 flex">
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
                <div className="flex items-center">
                    <SelectCoins coinlist={coinlist} setSelectCoin={setSelectCoin} />
                </div>
                <div className="mx-auto mt-5">
                    <label className="block mb-2 text-sm font-bold text-gray-900/50">
                    </label>
                    <form className="mx-auto flex">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 end-1 top-5 right-0 ps-3.5 mr-1">
                                <CopyToClipboard
                                    text={injectiveAddress}
                                    onCopy={(_, result) => {
                                        if (result) setIsCoppy(true);
                                    }}
                                >
                                    {isCoppy === true ? (
                                        <svg className="hover:cursor-pointer ltr:mr-2 ml-1 mb-1" fill="#000" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 448 512">
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
                            <TextInput
                                type="text"
                                required
                                style={{ outline: "none" }}
                                disabled
                                value={injectiveAddress}
                                className="block disalbed:!opacity-1 p-2.5 w-full z-20 pr-10 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-300 font-ibm"
                            />
                        </div>
                    </form>
                    <div className="mt-5 flex flex-col">
                        <span>Network: <span className="font-semibold">Injective</span></span>
                        <span>MEMO: <span className="font-semibold">Not required</span></span>
                    </div>
                    <div className="flex justify-center mt-5">
                        <img className="w-64 border rounded-lg" src={dataUri} alt="" />
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
};

export default Index;
