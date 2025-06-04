import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Menu, Transition } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import CopyToClipboard from "react-copy-to-clipboard";
import { Cog6ToothIcon, ArrowUpTrayIcon, BanknotesIcon } from "@heroicons/react/20/solid";
import {
  ClipboardDocumentIcon,
  CheckIcon as ClipCheck,
} from "@heroicons/react/24/outline";
import INJ from "@/images/injective_logo.png";
import ELEM from "@/images/ELEM.png";
import Link from "next/link";
import ProfileInvite from "@/components/profile_invite";
import ExportWallet from "@/components/export_wallet";
import {
  FirstPage,
  SecondPage,
  ThirdPage,
  FourthPage,
  Verify2FA,
} from "@/components/2fa";
import Withdraw from "@/components/withdraw";
import Deposit from "@/components/deposit";
import { formatAddress, formatPriceNumber, roundDown } from "@/libs/custom";
import { BACKEND_API } from "@/config";
import { signOut, useMeQuery } from "@/hooks/useMeQuery";
import axiosApi from "@/libs/axios";

const inter = Inter({ subsets: ["latin"] });

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Index() {
  const { data: user, coinlist: coins, reload: reloadMe, loading } = useMeQuery('username profile_image_url two_factor_enabled addresses');
  const [coinlist, setCoinlist] = useState(coins);
  const [isCoppy, setIsCoppy] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>("");
  const injectiveAddress = user?.addresses.injectiveAddress as string;
  const [verifyOtp, setVerifyOtp] = useState("");

  const [dataPrice, setDataPrice] = useState<{ INJ_price: number; XNJ_price: number }>({ INJ_price: 0, XNJ_price: 0.05 });

  useEffect(() => {
    setCoinlist(coins);
  }, [coins]);

  useEffect(() => {
    toast.remove();
  }, []);

  useEffect(() => {
    if (user?.addresses?.injectiveAddress) {
      setDataPrice(prev => ({ ...prev, XNJ_price: user.appConfig.XNJ_price }));

      axiosApi
        .get(`${BACKEND_API}/api/blockchain/get-borrow`)
        .then((response) => {
          setDataPrice((prev: any) => ({ ...prev, INJ_price: response.data.inj_price }));
        })
        .catch((error) => {
          console.error('Error fetching borrows', error);
          error.response.status === 403 && signOut(reloadMe);
        });
    }
  }, [user?.addresses?.injectiveAddress]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (isCoppy === true) {
      timeoutId = setTimeout(() => setIsCoppy(false), 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [isCoppy]);

  if (!user) {
    return (
      !loading && (
        <main className={`items-center h-[600px] bg-white justify-between ${inter.className} no-scrollbar overflow-y-auto`}
        >
          <div className="mt-10 flex flex-col items-center font-ibm">
            <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/logo.png'} width={200} height={200} />
            <span className="text-center text-lg font-ibm font-bold text-black mt-10">Train your Ninja, Fight & Take profit on Twitter</span>
            <button
              className="mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  window.location.href = `${BACKEND_API}/auth2/twitter`;
                } else {
                  chrome.tabs.create({ url: `${BACKEND_API}/auth/twitter` });
                };
              }}
            >
              Sign in
            </button>
          </div>
        </main>
      )
    );
  }

  if (currentPage === "deposit")
    return (
      <Deposit
        injectiveAddress={injectiveAddress}
        coinlist={coinlist}
        setCoinlist={setCoinlist}
        setPage={setCurrentPage}
      />
    );

  if (currentPage === "withdraw")
    return (
      <Withdraw
        injectiveAddress={injectiveAddress}
        coinlist={coinlist}
        setCoinlist={setCoinlist}
        setPage={setCurrentPage}
      />
    );

 /*  if (currentPage === "invite_page")
    return (
      <ProfileInvite
        user={user}
        reloadMe={reloadMe}
        backToProfile={() => setCurrentPage("")}
      />
    ); */

  if (currentPage === "2fa_page_1")
    return <FirstPage setPage={setCurrentPage} />;

  if (currentPage === "2fa_page_2")
    return <SecondPage reloadMe={reloadMe} setPage={setCurrentPage} />;

  if (currentPage === "2fa_page_3")
    return <ThirdPage reloadMe={reloadMe} setPage={setCurrentPage} />;

  if (currentPage === "2fa_page_4")
    return <FourthPage reloadMe={reloadMe} setPage={setCurrentPage} />;

  if (currentPage === "2fa_page_verify")
    return (
      <Verify2FA
        reloadMe={reloadMe}
        onVerify={(otp) => {
          setVerifyOtp(otp);
          setCurrentPage(otp ? "export_wallet" : "");
        }}
      />
    );

  if (currentPage === "export_wallet")
    return (
      <ExportWallet
        totpCode={verifyOtp}
        reloadMe={reloadMe}
        setPage={setCurrentPage}
      />
    );

  return (
    <main
      className={`items-center h-[600px] bg-white justify-between ${inter.className} no-scrollbar overflow-y-auto`}
    >
      <div className="flex items-center border-b border-white-light p-1 px-4 justify-between ">
        <button
          type="button"
          className="text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm px-3 py-2 text-center inline-flex items-center"
        >
          <Image src={INJ} alt="" width={24} height={24} />
          Injective
        </button>
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="text-black hover:animate-spin motion-reduce:animate-none">
              <Cog6ToothIcon className="w-6 h-6" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <div
                      onClick={() =>
                        user.two_factor_enabled
                          ? setCurrentPage("2fa_page_verify")
                          : toast(
                            "You need to enable the 2FA feature to be able to export wallet",
                            {
                              duration: 3000,
                              className: "font-pixel text-xs",
                            }
                          )
                      }
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "block px-4 py-2 text-sm font-semibold hover:cursor-pointer"
                      )}
                    >
                      Export Wallet Private Key
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      onClick={() =>
                        user.two_factor_enabled
                          ? setCurrentPage("2fa_page_4")
                          : setCurrentPage("2fa_page_1")
                      }
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "block px-4 py-2 text-sm font-semibold hover:cursor-pointer"
                      )}
                    >
                      2-Factor Authentication
                    </div>
                  )}
                </Menu.Item>
                <form method="POST" action="#">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        className={classNames(
                          "inline-flex items-center gap-x-1.5 px-4 py-2 text-sm font-semibold text-red-500"
                        )}
                        onClick={() => signOut(reloadMe)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </form>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="mt-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Image
            src={user.profile_image_url || ELEM}
            width={64}
            height={64}
            className="rounded-full"
            alt=""
          />
        </div>
        <div className="mt-3 text-center">
          <h3 className="text-xs text-black font-semibold leading-6 text-black-900">
            @{user.username}
          </h3>
          <div className="flex justify-center mt-1">
            <p className="text-xs text-black">
              {formatAddress(injectiveAddress)}
            </p>
            <CopyToClipboard
              text={injectiveAddress}
              onCopy={(text, result) => {
                if (result) setIsCoppy(true);
              }}
            >
              {isCoppy === true ? (
                <ClipCheck className="w-5 h-5 text-black" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5 text-black" />
              )}
            </CopyToClipboard>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-x-4 mt-4">
        <button
          type="button"
          className="text-gray-900 bg-gray-100 hover:bg-gray-200 border rounded-lg text-xs w-24 px-3 py-1 text-center inline-flex items-center"
          onClick={() => setCurrentPage("deposit")}
        >
          <BanknotesIcon className="w-6 h-6 p-1" />
          Deposit
        </button>
        <button
          type="button"
          className="text-gray-900 bg-gray-100 hover:bg-gray-200 border rounded-lg text-xs w-24 px-3 py-1 text-center inline-flex items-center"
          onClick={() => user.two_factor_enabled
            ? setCurrentPage('withdraw')
            : toast('You need to enable the 2FA feature to be able to withdraw', { duration: 3000, className: 'font-ibm text-xs' })}
        >
          <ArrowUpTrayIcon className="w-6 h-6" />
          Withdraw
        </button>
      </div>

      {/* <div className="flex items-center justify-between mt-6 px-6">
        <div className="text-gray-900 text-xs">Refer friends - Earn rebates</div>
        <button
          className="text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs px-3 py-2 text-center inline-flex items-center"
          onClick={() => setCurrentPage("invite_page")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="mr-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 12H7V13H13V12H14V11H15V5H14V4H13V3H7V4H6V5H5V11H6V12ZM7 7H8V6H9V5H11V6H12V7H13V9H12V10H11V11H9V10H8V9H7V7Z"
              fill="black"
            />
            <path
              d="M17 15H16V14H4V15H3V16H2V21H4V18H5V17H6V16H14V17H15V18H16V19V20V21H18V16H17V15Z"
              fill="black"
            />
            <path d="M20 7V6V5H18V7H16V9H18V11H20V9H22V7H20Z" fill="black" />
          </svg>
          Invite Friend
        </button>
      </div> */}

      <ul role="list" className="mt-2 px-4">
        <h3 className="text-gray-900 text-sm text-semibold p-1">Assets</h3>
        {coinlist.map((event) => (
          <div key={event.id} className="w-full overflow-hidden rounded-xl px-6 py-2 shadow mb-2 bg-[#f5f5f5] text-black">
            <div className="relative">
              <div className="relative flex space-x-3 items-center">
                <div>
                  <span className={classNames(event.iconBackground, 'h-12 w-12 rounded-full flex items-center justify-center')}>
                    <img src={event.icon} alt="" className="w-[45px] h-[45px]" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="flex justify-center">
                    <div className="flex flex-col">
                      <div>
                        <p className="text-sm font-black">{event.token}</p>
                      </div>
                      <div className="whitespace-nowrap text-sm">{event.isLoading ? <span>Loading...</span> : formatPriceNumber(Number(roundDown(event.balance, 2)))}</div>
                    </div>
                  </div>
                  {event.token === 'INJ' && <div className="whitespace-nowrap text-right text-sm pt-3">{dataPrice.INJ_price === 0 ? <span>Loading...</span> : '$' + formatPriceNumber(Number(roundDown(Number(roundDown(dataPrice.INJ_price, 2)) * Number(roundDown(event.balance, 2)), 2)))}</div>}
                  {event.token === 'XNJ' && <div className="whitespace-nowrap text-right text-sm pt-3">{dataPrice.XNJ_price === 0 ? <span>Loading...</span> : '$' + formatPriceNumber(Number(roundDown(Number(roundDown(dataPrice.XNJ_price, 2)) * Number(roundDown(event.balance, 2)), 2)))}</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ul>
      <div className="">
        <nav
          className="text-xs flex justify-center gap-x-1 md:gap-x-6"
          aria-label="quick links"
        >
          <Link
            href="https://xninja.tech"
            target="_blank"
            className="inline-block rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Website
          </Link>
          <Link
            href="https://twitter.com/xninja_tech"
            target="_blank"
            className="inline-block rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Twitter
          </Link>
          <Link
            href="https://docs.xninja.tech"
            target="_blank"
            className="inline-block rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Docs
          </Link>
        </nav>
      </div>
      <Toaster />
    </main>
  );
}
