import { CONFIG_BOOSTS, LEVEL_NINJAS } from "@/lib/game-config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Fragment, useEffect, useState } from "react";
import { DataTable } from "mantine-datatable";
import { Dialog, Transition } from '@headlessui/react';
import Dropdown from "@/components/Dropdown";
import toast, { Toaster } from 'react-hot-toast';

export async function getServerSideProps(context: any) {
  return { props: { detailId: context.params.detailId } };
}

function TimeAgo({ date }: { date: Date }) {
  const [timeAgo] = useState(() => calculateTimeDifference(date, new Date()));

  function calculateTimeDifference(date1: Date, date2: Date) {
    if (typeof date1 === "string") date1 = new Date(date1);

    const timeDifferenceInMs = date2.getTime() - date1.getTime();

    const seconds = Math.floor(timeDifferenceInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? `${days} day ago` : `${days} days ago`;
    }
    if (hours > 0) {
      return hours === 1 ? `${hours} hour ago` : `${hours} hours ago`;
    }
    if (minutes > 0) {
      return minutes === 1 ? `${minutes} minute ago` : `${minutes} minutes ago`;
    }
    if (seconds > 0) {
      return seconds === 1 ? `${seconds} second ago` : `${seconds} seconds ago`;
    }
    return "just now";
  }

  return <span>{timeAgo}</span>;
}

function getBoostData(boosts: { count: number; date: string } | undefined) {
  if (!boosts) return null;

  const currentDate = new Date();

  const sortedKeys = Object.keys(CONFIG_BOOSTS)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < sortedKeys.length; i++) {
    if (boosts.count < sortedKeys[i]) {
      const data = CONFIG_BOOSTS[sortedKeys[i - 1]];

      return data &&
        (currentDate.getTime() - Date.parse(boosts.date)) / (24 * 60 * 60 * 1000) < data.day
        ? data.boost
        : null;
    }
  }

  return CONFIG_BOOSTS[sortedKeys[sortedKeys.length - 1]].boost;
}

function isNumeric(str: string) {
  if (typeof str !== "string") return false
  return !isNaN(parseFloat(str)) && !isNaN(Number(str));
};

import Decimal from "decimal.js";
import { ethers } from "ethers";

export function formatPriceNumber(value: number, decimals?: number): string {
  if (isNaN(value)) return "N/A";

  if (Math.abs(value) < 1e-10) {
    return "0.00";
  }

  let stringValue = roundDown(value, 10);

  stringValue = stringValue.replace(/\.?0+$/, "");

  const parts = stringValue.split(".");
  const integerPart = Number(parts[0]).toLocaleString();
  const decimalPart = parts[1] || "";
  return decimalPart
    ? `${integerPart}.${decimalPart.slice(0, decimals || decimalPart.length)}`
    : integerPart;
}

export function roundDown(value: number | string, decimals: number, DOWN?: boolean) {
  let result = new Decimal(value).toFixed(decimals, Decimal.ROUND_DOWN);
  if (DOWN) {
    let adjustment = new Decimal(1).dividedBy(new Decimal(10).pow(decimals));
    result = new Decimal(result).minus(adjustment).toFixed(decimals, Decimal.ROUND_DOWN);
  }
  return result;
}

export default function Index({ detailId }: { detailId: string }) {
  const { data: session }: any = useSession();
  const [dataDetail, setDataDetail] = useState<any>();

  useEffect(() => {
    if (session) {
      if ((session as any).user?.role !== "subcriber") {
        axios
          .get(`/api/user_detail`, { params: { detailId } })
          .then((response) => setDataDetail(response.data))
          .catch((error) => console.error(error));
      }
    }
  }, [session, detailId]);

  const [farmData, setFarmData] = useState({ earned: 0, total_earn_speed_hour: 0 });

  useEffect(() => {
    const now = Date.now();
    let intervalId: undefined | NodeJS.Timeout;

    if (dataDetail?.user_ninjas) {
      const { earned, total_earn_speed_hour } = (
        dataDetail?.user_ninjas as {
          farm_at: string;
          mana: string;
          balance: number;
          class: string;
          level: number;
        }[]
      ).reduce(
        (previousValue, currentValue) => {
          if (dataDetail?.user) {
            let earned = 0;
            let total_earn_speed_hour = 0;

            const farm_at = Date.parse(currentValue.farm_at);
            const mana = Date.parse(currentValue.mana);
            const balance = currentValue.balance;
            const _class = currentValue.class;
            const level = currentValue.level;
            const boost = getBoostData(dataDetail?.user?.boosts) || 0;

            if (farm_at) {
              if (now >= mana) {
                if ((LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                  const balance =
                    ((mana - farm_at) / (60 * 60 * 1000)) *
                    LEVEL_NINJAS[_class][level].farm_speed_hour;
                  earned += balance + (balance * boost) / 100;
                }
              } else {
                if (LEVEL_NINJAS[_class][level]) {
                  const balance =
                    ((now - farm_at) / (60 * 60 * 1000)) *
                    LEVEL_NINJAS[_class][level].farm_speed_hour;
                  earned += balance + (balance * boost) / 100;
                }
                total_earn_speed_hour +=
                  LEVEL_NINJAS[_class][level].farm_speed_hour +
                  (LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
              }
            }

            earned += balance || 0;

            return {
              earned: (previousValue.earned += earned),
              total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour),
            };
          }
          return previousValue;
        },
        { earned: 0, total_earn_speed_hour: 0 }
      );

      setFarmData({ earned, total_earn_speed_hour });

      intervalId = setInterval(() => {
        const now = Date.now();

        const { earned, total_earn_speed_hour } = (
          dataDetail?.user_ninjas as {
            farm_at: string;
            mana: string;
            balance: number;
            class: string;
            level: number;
          }[]
        ).reduce(
          (previousValue, currentValue) => {
            if (dataDetail?.user) {
              let earned = 0;
              let total_earn_speed_hour = 0;

              const farm_at = Date.parse(currentValue.farm_at);
              const mana = Date.parse(currentValue.mana);
              const balance = currentValue.balance;
              const _class = currentValue.class;
              const level = currentValue.level;
              const boost = getBoostData(dataDetail?.user?.boosts) || 0;

              if (farm_at) {
                if (now >= mana) {
                  if ((LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                    const balance =
                      ((mana - farm_at) / (60 * 60 * 1000)) *
                      LEVEL_NINJAS[_class][level].farm_speed_hour;
                    earned += balance + (balance * boost) / 100;
                  }
                } else {
                  if (LEVEL_NINJAS[_class][level]) {
                    const balance =
                      ((now - farm_at) / (60 * 60 * 1000)) *
                      LEVEL_NINJAS[_class][level].farm_speed_hour;
                    earned += balance + (balance * boost) / 100;
                  }
                  total_earn_speed_hour +=
                    LEVEL_NINJAS[_class][level].farm_speed_hour +
                    (LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
                }
              }

              earned += balance || 0;

              return {
                earned: (previousValue.earned += earned),
                total_earn_speed_hour: (previousValue.total_earn_speed_hour +=
                  total_earn_speed_hour),
              };
            }
            return previousValue;
          },
          { earned: 0, total_earn_speed_hour: 0 }
        );

        setFarmData({ earned, total_earn_speed_hour });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [dataDetail]);

  // Ninja
  const [ninjaPage, ninjaSetPage] = useState(1);
  const [ninjaPageSize] = useState(5);
  const [ninjaRecordsData, ninjaSetRecordsData] = useState<
    { farm_at: string; mana: string; balance: number; class: string; level: number }[]
  >([]);

  useEffect(() => {
    ninjaSetPage(1);
  }, [ninjaPageSize]);

  useEffect(() => {
    const from = (ninjaPage - 1) * ninjaPageSize;
    const to = from + ninjaPageSize;
    ninjaSetRecordsData([
      ...((
        dataDetail?.user_ninjas as {
          farm_at: string;
          mana: string;
          balance: number;
          class: string;
          level: number;
        }[]
      )?.slice(from, to) || []),
    ]);
  }, [ninjaPage, ninjaPageSize, dataDetail]);

  // Borrow
  const [borrowPage, borrowSetPage] = useState(1);
  const [borrowPageSize] = useState(5);
  const [borrowRecordsData, borrowSetRecordsData] = useState<
    { amount: string; loanAmount: string; created_at: string }[]
  >([]);

  useEffect(() => {
    borrowSetPage(1);
  }, [borrowPageSize]);

  useEffect(() => {
    const from = (borrowPage - 1) * borrowPageSize;
    const to = from + borrowPageSize;
    borrowSetRecordsData([
      ...((
        dataDetail?.user_borrows as { amount: string; loanAmount: string; created_at: string }[]
      )?.slice(from, to) || []),
    ]);
  }, [borrowPage, borrowPageSize, dataDetail]);

  // Repay
  const [repayPage, repaySetPage] = useState(1);
  const [repayPageSize] = useState(5);
  const [repayRecordsData, repaySetRecordsData] = useState<
    { amount: string; loanAmount: string; created_at: string }[]
  >([]);

  useEffect(() => {
    repaySetPage(1);
  }, [repayPageSize]);

  useEffect(() => {
    const from = (repayPage - 1) * repayPageSize;
    const to = from + repayPageSize;
    repaySetRecordsData([
      ...((
        dataDetail?.user_repays as { amount: string; loanAmount: string; created_at: string }[]
      )?.slice(from, to) || []),
    ]);
  }, [repayPage, repayPageSize, dataDetail]);

  // Convert XNJ > ELEM
  const [convertXNJPage, convertXNJSetPage] = useState(1);
  const [convertXNJPageSize] = useState(5);
  const [convertXNJRecordsData, convertXNJSetRecordsData] = useState<
    { amount: number; created_at: string }[]
  >([]);

  useEffect(() => {
    convertXNJSetPage(1);
  }, [convertXNJPageSize]);

  useEffect(() => {
    const from = (convertXNJPage - 1) * convertXNJPageSize;
    const to = from + convertXNJPageSize;
    convertXNJSetRecordsData([
      ...((dataDetail?.user_xnj_converts as { amount: number; created_at: string }[])?.slice(
        from,
        to
      ) || []),
    ]);
  }, [convertXNJPage, convertXNJPageSize, dataDetail]);

  // Convert ELEM > XNJ
  const [convertELEMPage, convertELEMSetPage] = useState(1);
  const [convertELEMPageSize] = useState(5);
  const [convertELEMRecordsData, convertELEMSetRecordsData] = useState<
    { amount: number; created_at: string }[]
  >([]);

  useEffect(() => {
    convertELEMSetPage(1);
  }, [convertELEMPageSize]);

  useEffect(() => {
    const from = (convertELEMPage - 1) * convertELEMPageSize;
    const to = from + convertELEMPageSize;
    convertELEMSetRecordsData([
      ...((dataDetail?.user_elem_converts as { amount: number; created_at: string }[])?.slice(
        from,
        to
      ) || []),
    ]);
  }, [convertELEMPage, convertELEMPageSize, dataDetail]);

  // Convert XNJ Queue
  const [convertELEMQueuePage, convertELEMQueueSetPage] = useState(1);
  const [convertELEMQueuePageSize] = useState(5);
  const [convertELEMQueueRecordsData, convertELEMQueueSetRecordsData] = useState<
    { _id: string; amount: number; created_at: string; akatsuki: boolean }[]
  >([]);

  useEffect(() => {
    convertELEMQueueSetPage(1);
  }, [convertELEMQueuePageSize]);

  useEffect(() => {
    const from = (convertELEMQueuePage - 1) * convertELEMQueuePageSize;
    const to = from + convertELEMQueuePageSize;
    convertELEMQueueSetRecordsData([
      ...((
        dataDetail?.queue_converts as {
          _id: string;
          amount: number;
          created_at: string;
          akatsuki: boolean;
        }[]
      )?.slice(from, to) || []),
    ]);
  }, [convertELEMQueuePage, convertELEMQueuePageSize, dataDetail]);

  // Convert XNJ Claims
  const [convertELEMClaimPage, convertELEMClaimSetPage] = useState(1);
  const [convertELEMClaimPageSize] = useState(5);
  const [convertELEMClaimRecordsData, convertELEMClaimSetRecordsData] = useState<
    { amount: number; success_at: string }[]
  >([]);

  useEffect(() => {
    convertELEMClaimSetPage(1);
  }, [convertELEMClaimPageSize]);

  useEffect(() => {
    const from = (convertELEMClaimPage - 1) * convertELEMClaimPageSize;
    const to = from + convertELEMClaimPageSize;
    convertELEMClaimSetRecordsData([
      ...((dataDetail?.user_claim_converts as { amount: number; success_at: string }[])?.slice(
        from,
        to
      ) || []),
    ]);
  }, [convertELEMClaimPage, convertELEMClaimPageSize, dataDetail]);

  const [addModal, setModal] = useState<any>(false);
  const [params, setParams] = useState<any>({});
  const [amount, setAmount] = useState('');

  const showDialog = (data: any) => {
    setParams(data);
    setModal(true);
  };

  // console.log(convertELEMClaimRecordsData, dataDetail?.user_claim_converts);

  async function updateAkatsukiStatus(_id: string) {
    try {
      const response = await axios.post("/api/queue_tables", {
        _id,
        akatsuki: false,
      });

      console.log("Update successful", response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Error data:", error.response.data);
          console.error("Error status:", error.response.status);
          console.error("Error headers:", error.response.headers);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error message:", error.message);
        }
      } else if (error instanceof Error) {
        console.error("Error", error.message);
      } else {
        console.error("An unexpected error occurred");
      }
    }
  }

  if (session && (session as any).user?.role === "subcriber")
    return (
      <div className="relative flex items-center rounded border border-danger bg-danger-light p-3.5 text-danger before:absolute before:top-1/2 before:-mt-2 before:inline-block before:border-b-8 before:border-r-8 before:border-t-8 before:border-b-transparent before:border-r-inherit before:border-t-transparent ltr:border-r-[64px] ltr:before:right-0 rtl:border-l-[64px] rtl:before:left-0 rtl:before:rotate-180 dark:bg-danger-dark-light">
        <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-right-11 rtl:-left-11">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </span>
        <span className="ltr:pr-2 rtl:pl-2">
          <strong className="ltr:mr-1 rtl:ml-1">Warning!</strong>You don't have access to this page.
        </span>
        <button type="button" className="hover:opacity-80 ltr:ml-auto rtl:mr-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
      </div>
    );

  return (
    session &&
    (session as any).user?.role !== "subcriber" &&
    dataDetail && (
      <>
        <div className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-2">
          <div className="panel" id="stack_form">
            <div className="flex items-center justify-end dark:text-white-light">
              <div className="dropdown">
                <Dropdown
                  offset={[0, 1]}
                  placement={`bottom-end`}
                  button={
                    <svg className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                >
                  <ul>
                    <li>
                      <button type="button" onClick={() => showDialog({ type: 'ADD_ELEM_OFFCHAIN' })} className="text-xs">ADD ELEM</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => showDialog({ type: 'REMOVE_ELEM_OFFCHAIN' })} className="text-xs">REMOVE ELEM</button>
                    </li>
                  </ul>
                </Dropdown>
              </div>
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h5 className="text-lg font-semibold dark:text-white-light">User Detail</h5>
            </div>
            <div className="mb-5 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold max-w-[200px]">
                <img
                  className="h-9 w-9 max-w-none rounded-md"
                  src={dataDetail.user?.profile_image_url}
                  alt="avatar"
                  onError={(e: any) => {
                    e.target.onerror = null;
                  }}
                />
                <div>
                  <span className="inline-flex items-center whitespace-nowrap font-bold">
                    {dataDetail.user?.name || dataDetail.user?.username}
                  </span>
                  <br />
                  <span className="whitespace-nowrap text-sm opacity-60">
                    @{dataDetail.user?.username}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Wallet Address: </span>
                <span className="font-bold">{dataDetail.user?.addresses?.injectiveAddress}</span>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Registration Date: </span>
                <span className="font-bold">
                  {new Date(dataDetail.user?.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Age: </span>
                <span className="font-bold">
                  <TimeAgo date={dataDetail.user?.created_at} />
                </span>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Current ELEM Free: </span>
                <span className="font-bold">{dataDetail.user?.wallet?.ELEM || 0}</span>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Total Farming Speed: </span>
                <span className={`font-bold`} style={{ fontWeight: 700 }}>
                  {formatPriceNumber(farmData.total_earn_speed_hour, 4) || 0}/h
                </span>
              </div>
              <div className="flex space-x-1">
                <span className="font-semibold">Unclaimed farm ELEM: </span>
                <div className="flex items-center">
                  {" "}
                  <div className="w-5 mr-1 bg-[#D9D9D9] rounded-full">
                    <img
                      src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png`}
                      alt=""
                    />
                  </div>
                  <span className="font-bold text-[#78716C]" style={{ fontWeight: 400 }}>
                    {farmData.earned > 0 ? formatPriceNumber(farmData.earned) : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">Ninja List</h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={ninjaRecordsData}
                columns={[
                  {
                    accessor: "name",
                    title: "Name",
                    titleClassName: "!text-center",
                    render: ({ level }) => (
                      <div className="text-center">
                        {level < 4 && "Ninja"}
                        {level > 4 && level <= 16 && "Guardian"}
                        {level > 16 && level <= 30 && "Sensei"}
                        {level > 30 && level <= 49 && "Master"}
                        {level === 50 && "Legend"}
                      </div>
                    ),
                  },
                  {
                    accessor: "class",
                    title: "Class",
                    titleClassName: "!text-center",
                    render: ({ class: ninja_class }) => (
                      <div className="text-center">{`${ninja_class[0].toUpperCase()}${ninja_class.slice(1, ninja_class.length)}`}</div>
                    ),
                  },
                  {
                    accessor: "level",
                    title: "Level",
                    titleClassName: "!text-center",
                    render: ({ level }) => <div className="text-center">{level}</div>,
                  },
                ]}
                totalRecords={dataDetail?.user_ninjas.length || 0}
                recordsPerPage={ninjaPageSize}
                page={ninjaPage}
                onPageChange={(p) => ninjaSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">Borrow History</h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={borrowRecordsData}
                columns={[
                  {
                    accessor: "created_at",
                    title: "Create Date",
                    titleClassName: "!text-center",
                    render: ({ created_at }) => (
                      <div className="text-center">{new Date(created_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "collateral",
                    title: "Collateral",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-6 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/injective_logo.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(
                              parseFloat(roundDown(ethers.formatEther(amount), 2))
                            )}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    accessor: "deb",
                    title: "Loan Amount",
                    titleClassName: "!text-center",
                    render: ({ loanAmount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(
                              parseFloat(roundDown(ethers.formatEther(loanAmount), 2))
                            )}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.user_borrows.length || 0}
                recordsPerPage={borrowPageSize}
                page={borrowPage}
                onPageChange={(p) => borrowSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">Repay History</h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={repayRecordsData}
                columns={[
                  {
                    accessor: "created_at",
                    title: "Paid Date",
                    titleClassName: "!text-center",
                    render: ({ created_at }) => (
                      <div className="text-center">{new Date(created_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "amount",
                    title: "Amount",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(
                              parseFloat(roundDown(ethers.formatEther(amount), 2))
                            )}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.user_repays.length || 0}
                recordsPerPage={repayPageSize}
                page={repayPage}
                onPageChange={(p) => repaySetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">
                {"XNJ > ELEM Convert History"}
              </h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={convertXNJRecordsData}
                columns={[
                  {
                    accessor: "created_at",
                    title: "Date",
                    titleClassName: "!text-center",
                    render: ({ created_at }) => (
                      <div className="text-center">{new Date(created_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "amount",
                    title: "Amount",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/ELEM.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(amount, 2)}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.user_xnj_converts.length || 0}
                recordsPerPage={convertXNJPageSize}
                page={convertXNJPage}
                onPageChange={(p) => convertXNJSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">
                {"ELEM > XNJ Convert History"}
              </h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={convertELEMRecordsData}
                columns={[
                  {
                    accessor: "created_at",
                    title: "Date",
                    titleClassName: "!text-center",
                    render: ({ created_at }) => (
                      <div className="text-center">{new Date(created_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "amount",
                    title: "Amount",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(amount, 2)}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.user_elem_converts.length || 0}
                recordsPerPage={convertELEMPageSize}
                page={convertELEMPage}
                onPageChange={(p) => convertELEMSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">
                {"ELEM > XNJ In Processs"}
              </h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={convertELEMQueueRecordsData}
                columns={[
                  {
                    accessor: "created_at",
                    title: "Date",
                    titleClassName: "!text-center",
                    render: ({ created_at }) => (
                      <div className="text-center">{new Date(created_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "amount",
                    title: "Amount",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(amount, 2)}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    accessor: "akatsuki",
                    title: "Date",
                    titleClassName: "!text-center",
                    render: ({ akatsuki, _id }) => (
                      <div className="text-center">
                        <div style={{ color: akatsuki ? "red" : "inherit" }}>
                          {akatsuki !== undefined ? akatsuki.toString() : "N/A"}
                        </div>
                        {akatsuki === true && (
                          <button
                            className="mt-2 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
                            onClick={() => updateAkatsukiStatus(_id)}
                          >
                            Set to False
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.queue_converts.length || 0}
                recordsPerPage={convertELEMQueuePageSize}
                page={convertELEMQueuePage}
                onPageChange={(p) => convertELEMQueueSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
          <div className="panel">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
              <h5 className="text-lg font-semibold dark:text-white-light">
                {"ELEM > XNJ Claim History"}
              </h5>
            </div>
            <div className="datatables">
              <DataTable
                highlightOnHover
                className={`table-hover whitespace-nowrap`}
                records={convertELEMClaimRecordsData}
                columns={[
                  {
                    accessor: "success_at",
                    title: "Date",
                    titleClassName: "!text-center",
                    render: ({ success_at }) => (
                      <div className="text-center">{new Date(success_at).toLocaleString()}</div>
                    ),
                  },
                  {
                    accessor: "amount",
                    title: "Amount",
                    titleClassName: "!text-center",
                    render: ({ amount }) => (
                      <div className="text-center">
                        <div className="flex justify-center items-center">
                          <img
                            className="w-5 mr-1"
                            src="https://xninja.s3.ap-southeast-1.amazonaws.com/images/XNJ.png"
                            alt=""
                          />
                          <span className={`flex font-bold font-ibm`}>
                            {formatPriceNumber(amount, 2)}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
                totalRecords={dataDetail?.user_claim_converts.length || 0}
                recordsPerPage={convertELEMClaimPageSize}
                page={convertELEMClaimPage}
                onPageChange={(p) => convertELEMClaimSetPage(p)}
                minHeight={200}
                paginationText={({ from, to, totalRecords }) =>
                  `Showing  ${from} to ${to} of ${totalRecords} entries`
                }
              />
            </div>
          </div>
        </div>
        <Transition appear show={addModal} as={Fragment}>
          <Dialog
            as="div"
            open={addModal}
            onClose={() => {
              setModal(false);
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
                    {params.type === 'ADD_ELEM_OFFCHAIN' && (
                      <>
                        <div className="flex flex-col border-b border-white-light font-semibold p-5">
                          <button
                            type="button"
                            onClick={() => {
                              setModal(false);
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
                          <div className="pt-4 text-lg font-medium ltr:pl-5 ltr:pr-[15px] rtl:pl-[50px] rtl:pr-5">
                            <input type="text" placeholder="Enter ELEM" className="form-input" value={amount} onChange={e => {
                              const amount = (e.target.value === '' || isNumeric(e.target.value)) && (e.target.value.length > 1 && e.target.value[0] === '0' && !e.target.value.startsWith('0.')) ? e.target.value.slice(1, e.target.value.length - 1) : e.target.value;

                              (e.target.value === '' || isNumeric(e.target.value)) && setAmount(amount);
                            }} required />
                            <button type="submit" className="btn btn-primary mt-6" onClick={() => {
                              if (!amount || isNaN(Number(amount))) {
                                toast.error('Please Enter ELEM amount!', { duration: 3000, className: 'font-ibm text-xs' });
                                return;
                              };

                              setAmount('');

                              const elem_amount = Number(amount);

                              toast.promise(
                                axios.post('/api/custom', { type: 'ADD_ELEM_OFFCHAIN', elem_amount, _id: detailId }),
                                {
                                  loading: 'Sending...',
                                  success: success => <b>{success.data.message}</b>,
                                  error: (error) => <b>{error.response.data.message}</b>,
                                },
                                {
                                  className: 'font-ibm text-xs',
                                }
                              );
                            }}>

                              Submit
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    {params.type === 'REMOVE_ELEM_OFFCHAIN' && (
                      <>
                        <div className="flex flex-col border-b border-white-light font-semibold p-5">
                          <button
                            type="button"
                            onClick={() => {
                              setModal(false);
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
                          <div className="pt-4 text-lg font-medium ltr:pl-5 ltr:pr-[15px] rtl:pl-[50px] rtl:pr-5">
                            <input type="text" placeholder="Enter ELEM" className="form-input" value={amount} onChange={e => {
                              const amount = (e.target.value === '' || isNumeric(e.target.value)) && (e.target.value.length > 1 && e.target.value[0] === '0' && !e.target.value.startsWith('0.')) ? e.target.value.slice(1, e.target.value.length - 1) : e.target.value;

                              (e.target.value === '' || isNumeric(e.target.value)) && setAmount(amount);
                            }} required />
                            <button type="submit" className="btn btn-primary mt-6" onClick={() => {
                              if (!amount || isNaN(Number(amount))) {
                                toast.error('Please Enter ELEM amount!', { duration: 3000, className: 'font-ibm text-xs' });
                                return;
                              };

                              setAmount('');

                              const elem_amount = Number(amount);

                              toast.promise(
                                axios.post('/api/custom', { type: 'REMOVE_ELEM_OFFCHAIN', elem_amount, _id: detailId }),
                                {
                                  loading: 'Sending...',
                                  success: success => <b>{success.data.message}</b>,
                                  error: (error) => <b>{error.data.message}</b>,
                                },
                                {
                                  className: 'font-ibm text-xs',
                                }
                              );
                            }}>

                              Submit
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
        <Toaster />
      </>
    )
  );
}
