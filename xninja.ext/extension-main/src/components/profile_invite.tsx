import Image from "next/image";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { formatPriceNumber } from "@/libs/custom";
import toast, { Toaster } from "react-hot-toast";
import { ArrowUturnLeftIcon } from "@heroicons/react/20/solid";
import {
  ClipboardDocumentIcon,
  CheckIcon as ClipCheck,
} from "@heroicons/react/24/outline";

import ChipIcon from "@/images/chip.svg";
import ElemIcon from "@/images/ELEM.png";
import { User, signOut } from "@/hooks/useMeQuery";
import { BACKEND_API } from "@/config";
import axiosApi from "@/libs/axios";

const Index = ({
  user,
  reloadMe,
  backToProfile,
}: {
  user: User;
  reloadMe: () => void;
  backToProfile: () => void;
}) => {
  const [isCoppy, setIsCoppy] = useState<boolean>(false);
  const [user_refs, setUserRefs] = useState<
    Array<{
      username: string;
      referral_date: string;
      rewards?: { ELEM: number };
    }>
  >([]);
  const [userRewards, setUserRewards] = useState<{
    ELEM?: number;
    claim_at?: Date;
  }>({});

  useEffect(() => {
    axiosApi
      .post(
        `${BACKEND_API}/api/profiles/referrals_history`,
        {},
      )
      .then((response) => {
        setUserRefs(response.data.user_refs);
        setUserRewards(response.data.user_rewards);
      })
      .catch((error) => {
        error.response.status === 403 && signOut(reloadMe);
      });
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (isCoppy === true) {
      timeoutId = setTimeout(() => setIsCoppy(false), 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [isCoppy]);

  return (
    <main
      className={`items-center h-[600px] bg-white text-black justify-between no-scrollbar overflow-y-auto`}
    >
      <div className="flex flex-col mt-4 px-4">
        <button
          onClick={() => backToProfile()}
          className="mb-4 flex text-black"
        >
          <ArrowUturnLeftIcon className="w-5 h-5 mt-1" />
          <span className={`ml-2 text-xl font-bold`}>Back</span>
        </button>
        <div className="flex w-full justify-center">
          <div className="flex flex-col mx-4 items-center">
            <span className="text-sm">Your invite</span>
            <span className={`mt-4 text-center text-base font-bold text-black`}>
              {user_refs?.length || 0}
            </span>
          </div>
          <div className="flex flex-col mx-4 items-center">
            <span className="text-sm">Reward from Invitees</span>
            <div className="flex w-full justify-center">
              <Image
                src={ElemIcon}
                alt=""
                width={32}
                height={32}
                className="mt-4 mr-1"
              />
              <span
                className={`flex mt-4 items-center text-base font-bold text-black`}
              >
                {formatPriceNumber(userRewards.ELEM || 0)}
              </span>
            </div>
            <button
              className="hover:cursor-pointer self-center btn bg-black text-white rounded-full shadow-none outline-none hover:bg-black/70 active:bg-black/90 disabled:opacity-[0.8] disabled:hover:bg-black disabled:active:bg-black font-pixel w-20 h-8 mt-4"
              disabled={!userRewards.ELEM}
              onClick={() => {
                axiosApi
                  .post(
                    `${BACKEND_API}/api/profiles/referrals_claim`
                  )
                  .then((response) => {
                    setUserRewards((prev) => ({
                      ...prev,
                      ELEM: prev.ELEM
                        ? prev.ELEM - response.data.balance
                        : 0,
                    }));
                    toast.success("Claim successfully!", {
                      duration: 3000,
                      className: "font-pixel text-xs",
                    });
                  })
                  .catch((error) => {
                    error.response.status === 403 && signOut(reloadMe);
                    if (error.response.status === 404) {
                      if (
                        error.response.data.status ===
                        "SOMETHING_WENT_WRONG"
                      ) {
                        toast.error(`Sorry something went wrong!`, {
                          duration: 3000,
                          className: "font-pixel text-xs",
                        });
                      } else if (
                        error.response.data.status ===
                        "NO_REWARDS_TO_CLAIM"
                      ) {
                        toast.error(`There are no rewards to claim!`, {
                          duration: 3000,
                          className: "font-pixel text-xs",
                        });
                      }
                    }
                  });
                }
              }
            >
              Claim
            </button>
          </div>
          <div className="flex flex-col mx-4 items-center">
            <span className="text-sm">Chips</span>
            <div className="flex w-full justify-center">
              <Image
                src={ChipIcon}
                alt=""
                width={32}
                height={32}
                className="mt-4"
              />
              <span
                className={`flex mt-4 items-center text-base font-bold text-black`}
              >
                {user.boosts?.count || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 mt-5 flex w-full rounded-xl bg-[#f5f5f5]">
          <span className="w-full text-sm">Copy invite code</span>
          <div className="flex w-full justify-end text-black">
            <span className="mr-1 text-sm">{user.invite_code}</span>
            <CopyToClipboard
              text={user.invite_code}
              onCopy={(_, result) => {
                if (result) setIsCoppy(true);
              }}
            >
              {isCoppy === true ? (
                <ClipCheck className="w-5 h-5 hover:cursor-pointer" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5 hover:cursor-pointer" />
              )}
            </CopyToClipboard>
          </div>
        </div>
        <div className="p-4 mt-5 flex flex-col w-full rounded-xl text-black bg-[#f5f5f5]">
          <span className="text-base font-black mb-1">History</span>
          <div className="w-full">
            <div className="table-responsive mb-4 h-64 max-h-64 overflow-y-auto scrollbar-hide">
              <table className="table-hover w-full">
                <thead className="sticky top-0">
                  <tr>
                    <th className="text-center text-xs">Time</th>
                    <th className="text-center text-xs">User</th>
                    <th className="text-center text-xs">Referrals reward</th>
                  </tr>
                </thead>
                <tbody className="overflow-y-auto scrollbar-hide">
                  {user_refs.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td className="text-center text-xs">{new Date(data.referral_date).toLocaleString()}</td>
                        <td className="text-center">
                          <div className="whitespace-nowrap text-center font-pixel">@{data.username}</div>
                        </td>
                        <td>
                          <div className="flex justify-center text-xs">
                            <img className="w-6 mr-1" src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png" alt="" />
                            <span className={`flex items-center font-bold text-black`}>{formatPriceNumber(data.rewards?.ELEM || 0)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </main >
  );
};

export default Index;