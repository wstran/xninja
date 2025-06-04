import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../store/themeConfigSlice";
import { useSession } from "next-auth/react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import axios from "axios";
import Link from "next/link";
import { downloadExcel } from 'react-export-table-to-excel';
import { ethers } from "ethers";
import Decimal from "decimal.js";

export function roundDown(value: number | string, decimals: number, DOWN?: boolean) {
  let result = new Decimal(value).toFixed(decimals, Decimal.ROUND_DOWN);
  if (DOWN) {
    let adjustment = new Decimal(1).dividedBy(new Decimal(10).pow(decimals));
    result = new Decimal(result).minus(adjustment).toFixed(decimals, Decimal.ROUND_DOWN);
  }
  return result;
}

function TimeAgo({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState(() => calculateTimeDifference(date, new Date()));

  useEffect(() => {
    setTimeAgo(calculateTimeDifference(date, new Date()));
    const intervalId = setInterval(() => {
      setTimeAgo(calculateTimeDifference(date, new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [date]);

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

const Header = ({
  children,
  firstContent,
  content,
  placeholder,
  onSearch,
}: {
  firstContent: string;
  children?: any;
  content: string;
  placeholder: string;
  onSearch: (term: string) => void;
}) => (
  <div className="mb-5 flex items-center justify-between text-xs lg:text-sm">
    {children || (
      <ul className="ml-1 flex space-x-2 rtl:space-x-reverse">
        <li>{firstContent}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{content}</span>
        </li>
      </ul>
    )}
    <div className="ml-1 flex items-center">
      <label className="mt-1 flex w-[350px] items-center">
        <input
          type="text"
          className="form-input rounded border p-2"
          placeholder={placeholder}
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
    </div>
  </div>
);

type Users = {
  _id: string;
  tw_id: string;
  addresses: { injectiveAddress: string };
  username: string;
  name: string;
  profile_image_url: string;
  created_at: Date;
  invite_code: string;
  last_login: Date;
  wallet: { ELEM: number };
  referral_code: string;
  total_borrowed_xnj?: number;
  total_collateral_inj?: number;
  total_repay_xnj?: number;
  total_repay_inj?: number;
  total_earned?: number;
  first_date_spent_chest?: string;
  total_spent_elem_offchain?: number;
  total_elem_spent_free: number;
  total_elem_spent_onchain: number;
  total_elem_spent: number;
  total_earned_and_claimed: number;
  total_ninja: number;
  total_ninja_level: number;
  akatsuki: number;
  total_earn_speed_hour: number;
  earned: number;
  boosts?: { count: number };
  onchain_balances?: { balances: { XNJ: { balance: string }; ELEM: { balance: string }; INJ: { balance: string } }, updated_at: string };
};

const Index = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle("Home"));
  });
  const { data: session } = useSession();

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState<Users[]>([]);
  const [recordsData, setRecordsData] = useState(initialRecords);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "created_at",
    direction: "asc",
  });
  const [INJ_price, setINJ_price] = useState(0.0);

  useEffect(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    axios
      .get('/api/admin')
      .then(response => {
        setInitialRecords(response.data.users);
        setINJ_price(response.data.INJ_price);
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const records = [...initialRecords];
    records.sort((a: { [key: string]: any }, b: { [key: string]: any }) => {
      if (sortStatus.columnAccessor === 'wallet.ELEM') {
        return (a.wallet?.ELEM || 0) - (b.wallet?.ELEM || 0);
      } else if (sortStatus.columnAccessor === 'onchain_balances.balances.INJ.balance') {
        return Number(roundDown((ethers.formatEther(a.onchain_balances?.balances.INJ.balance || 0)), 4)) - Number(roundDown((ethers.formatEther(b.onchain_balances?.balances.INJ.balance || 0)), 4));
      } else if (sortStatus.columnAccessor === 'onchain_balances.balances.ELEM.balance') {
        return Number(roundDown((ethers.formatEther(a.onchain_balances?.balances.ELEM.balance || 0)), 4)) - Number(roundDown((ethers.formatEther(b.onchain_balances?.balances.ELEM.balance || 0)), 4));
      } else if (sortStatus.columnAccessor === 'boosts.count') {
        return (a.boosts?.count || 0) - (b.boosts?.count || 0);
      } else if (sortStatus.columnAccessor === 'LTV') {
        const a_debt = (a.total_borrowed_xnj || 0) - (a.total_repay_xnj || 0);
        const _acollateral = (a.total_collateral_inj || 0) - (a.total_repay_inj || 0);
        const a_value = (a_debt * 0.05) / (_acollateral * INJ_price);

        const b_debt = (b.total_borrowed_xnj || 0) - (b.total_repay_xnj || 0);
        const b_collateral = (b.total_collateral_inj || 0) - (b.total_repay_inj || 0);
        const b_value = (b_debt * 0.05) / (b_collateral * INJ_price);

        return (a_value || 0) - (b_value || 0);
      } else if (sortStatus.columnAccessor === 'current_deb_xnj') {

        return ((a.total_borrowed_xnj || 0) - (a.total_repay_xnj || 0)) - ((b.total_borrowed_xnj || 0) - (b.total_repay_xnj || 0))
      } else if (sortStatus.columnAccessor === 'current_collateral_inj') {

        return ((a.total_collateral_inj || 0) - (a.total_repay_inj || 0)) - ((b.total_collateral_xnj || 0) - (b.total_repay_inj || 0))
      } else if (sortStatus.columnAccessor === 'cheat_detected') {

        return ((b.total_elem_spent || 0) - (b.total_earned_and_claimed || 0)) - ((a.total_elem_spent || 0) - (a.total_earned_and_claimed || 0));
      } else if (sortStatus.columnAccessor === 'akatsuki') {

        return (b.akatsuki ? 1 : -1) - (a.akatsuki ? 1 : -1);
      };
      return (a[sortStatus.columnAccessor] || 0) - (b[sortStatus.columnAccessor] || 0)
    })

    setInitialRecords(sortStatus.direction === 'desc' ? records.reverse() : records);
    setPage(1);
  }, [sortStatus]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return recordsData;

    if (searchTerm.startsWith('tw_id:')) return initialRecords.filter((user: any) => {
      return user.tw_id?.toLowerCase().includes(searchTerm.slice(6, searchTerm.length).toLowerCase());
    }).slice(0, pageSize);

    if (searchTerm.startsWith('ref:')) return initialRecords.filter((user: any) => {
      return user.referral_code?.toLowerCase().includes(searchTerm.slice(4, searchTerm.length).toLowerCase());
    }).slice(0, pageSize);

    if (searchTerm.startsWith('invite:')) return initialRecords.filter((user: any) => {
      return user.invite_code?.toLowerCase().includes(searchTerm.slice(7, searchTerm.length).toLowerCase());
    }).slice(0, pageSize);

    return initialRecords.filter((user: any) => {
      return user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    }).slice(0, pageSize);
  }, [recordsData, searchTerm, initialRecords]);

  return (
    <>
      {session && (session as any).user?.role === "subcriber" && (
        <div className="relative flex items-center rounded border border-danger bg-danger-light p-3.5 text-danger before:absolute before:top-1/2 before:-mt-2 before:inline-block before:border-b-8 before:border-r-8 before:border-t-8 before:border-b-transparent before:border-r-inherit before:border-t-transparent ltr:border-r-[64px] ltr:before:right-0 rtl:border-l-[64px] rtl:before:left-0 rtl:before:rotate-180 dark:bg-danger-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-right-11 rtl:-left-11">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                opacity="0.5"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M12 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </span>
          <span className="ltr:pr-2 rtl:pl-2">
            <strong className="ltr:mr-1 rtl:ml-1">Warning!</strong>You don't have access to this
            page.
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
      )}
      {session && (session as any).user?.role !== "subcriber" && (
        <div>
          <div className="panel">
            <Header
              firstContent="Overview"
              content="Users"
              placeholder="Search > (tw_id:) (ref:) - (invite:) - {default:username}"
              onSearch={setSearchTerm}
            >
              <button disabled={recordsData.length === 0} type="button" className="btn btn-primary btn-sm m-1" onClick={() => downloadExcel({
                fileName: 'users',
                sheet: 'users',
                tablePayload: {
                  header: ['Username', 'Wallet Address', 'Join Date', 'First Day Spent (chest)', 'Total Borrowed (XNJ)', 'Total Collateral (INJ)', 'Current Deb (XNJ)', 'Current Collateral (INJ)', 'Current Balance ELEM_Free', 'Current Balance ELEM_Onchain', 'Current Balance INJ_Onchain',/*  'Current Balance XNJ_Onchain', */ 'ELEM Free Spent', 'ELEM Onchain Spent', 'Total ELEM Spent', 'ELEM Farmed in Training', 'LTV'],
                  body: initialRecords.map(i => ({
                    username: i.username,
                    injectiveAddress: i.addresses.injectiveAddress,
                    join_date: new Date(i.created_at).toLocaleDateString(),
                    first_date_spent_chest: new Date(i.first_date_spent_chest as string).toLocaleDateString(),
                    total_borrowed_xnj: (i.total_borrowed_xnj ? i.total_borrowed_xnj : 0).toFixed(4),
                    total_collateral_inj: (i.total_collateral_inj ? i.total_collateral_inj : 0).toFixed(4),
                    current_deb_xnj: ((i.total_borrowed_xnj || 0) - (i.total_repay_xnj || 0)).toFixed(4),
                    current_collateral_inj: ((i.total_collateral_inj || 0) - (i.total_repay_inj || 0)).toFixed(4),
                    'wallet.ELEM': (i.wallet?.ELEM || 0).toFixed(4),
                    'onchain_balances.balance.ELEM': roundDown((ethers.formatEther(i.onchain_balances?.balances.ELEM.balance || 0)), 4),
                    'onchain_balances.balance.INJ': roundDown((ethers.formatEther(i.onchain_balances?.balances.INJ.balance || 0)), 4),
                    /* 'onchain_balances.balance.XNJ': roundDown((ethers.formatEther(i.onchain_balances?.balances.XNJ || 0)), 4), */
                    total_elem_spent_free: (i.total_elem_spent_free || 0).toFixed(4),
                    total_elem_spent_onchain: (i.total_elem_spent_onchain || 0).toFixed(4),
                    total_elem_spent: (i.total_elem_spent || 0).toFixed(4),
                    total_earned_and_claimed: (i.total_earned_and_claimed || 0).toFixed(4),
                    LTV: (() => {
                      const debt =
                        (i.total_borrowed_xnj || 0) -
                        (i.total_repay_xnj || 0);
                      const collateral =
                        (i.total_collateral_inj || 0) -
                        (i.total_repay_inj || 0);
                      const value =
                        (debt * 0.05) / (collateral * INJ_price);
                      const showValue =
                        (!isNaN(value) ? value.toFixed(2) : "0.00") + "%";
                      return showValue.startsWith("0.")
                        ? showValue.slice(2, showValue.length)
                        : showValue;
                    })()
                  })),
                },
              })
              }>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ltr:mr-2 rtl:ml-2">
                  <path
                    d="M15.3929 4.05365L14.8912 4.61112L15.3929 4.05365ZM19.3517 7.61654L18.85 8.17402L19.3517 7.61654ZM21.654 10.1541L20.9689 10.4592V10.4592L21.654 10.1541ZM3.17157 20.8284L3.7019 20.2981H3.7019L3.17157 20.8284ZM20.8284 20.8284L20.2981 20.2981L20.2981 20.2981L20.8284 20.8284ZM14 21.25H10V22.75H14V21.25ZM2.75 14V10H1.25V14H2.75ZM21.25 13.5629V14H22.75V13.5629H21.25ZM14.8912 4.61112L18.85 8.17402L19.8534 7.05907L15.8947 3.49618L14.8912 4.61112ZM22.75 13.5629C22.75 11.8745 22.7651 10.8055 22.3391 9.84897L20.9689 10.4592C21.2349 11.0565 21.25 11.742 21.25 13.5629H22.75ZM18.85 8.17402C20.2034 9.3921 20.7029 9.86199 20.9689 10.4592L22.3391 9.84897C21.9131 8.89241 21.1084 8.18853 19.8534 7.05907L18.85 8.17402ZM10.0298 2.75C11.6116 2.75 12.2085 2.76158 12.7405 2.96573L13.2779 1.5653C12.4261 1.23842 11.498 1.25 10.0298 1.25V2.75ZM15.8947 3.49618C14.8087 2.51878 14.1297 1.89214 13.2779 1.5653L12.7405 2.96573C13.2727 3.16993 13.7215 3.55836 14.8912 4.61112L15.8947 3.49618ZM10 21.25C8.09318 21.25 6.73851 21.2484 5.71085 21.1102C4.70476 20.975 4.12511 20.7213 3.7019 20.2981L2.64124 21.3588C3.38961 22.1071 4.33855 22.4392 5.51098 22.5969C6.66182 22.7516 8.13558 22.75 10 22.75V21.25ZM1.25 14C1.25 15.8644 1.24841 17.3382 1.40313 18.489C1.56076 19.6614 1.89288 20.6104 2.64124 21.3588L3.7019 20.2981C3.27869 19.8749 3.02502 19.2952 2.88976 18.2892C2.75159 17.2615 2.75 15.9068 2.75 14H1.25ZM14 22.75C15.8644 22.75 17.3382 22.7516 18.489 22.5969C19.6614 22.4392 20.6104 22.1071 21.3588 21.3588L20.2981 20.2981C19.8749 20.7213 19.2952 20.975 18.2892 21.1102C17.2615 21.2484 15.9068 21.25 14 21.25V22.75ZM21.25 14C21.25 15.9068 21.2484 17.2615 21.1102 18.2892C20.975 19.2952 20.7213 19.8749 20.2981 20.2981L21.3588 21.3588C22.1071 20.6104 22.4392 19.6614 22.5969 18.489C22.7516 17.3382 22.75 15.8644 22.75 14H21.25ZM2.75 10C2.75 8.09318 2.75159 6.73851 2.88976 5.71085C3.02502 4.70476 3.27869 4.12511 3.7019 3.7019L2.64124 2.64124C1.89288 3.38961 1.56076 4.33855 1.40313 5.51098C1.24841 6.66182 1.25 8.13558 1.25 10H2.75ZM10.0298 1.25C8.15538 1.25 6.67442 1.24842 5.51887 1.40307C4.34232 1.56054 3.39019 1.8923 2.64124 2.64124L3.7019 3.7019C4.12453 3.27928 4.70596 3.02525 5.71785 2.88982C6.75075 2.75158 8.11311 2.75 10.0298 2.75V1.25Z"
                    fill="currentColor"
                  />
                  <path opacity="0.5" d="M13 2.5V5C13 7.35702 13 8.53553 13.7322 9.26777C14.4645 10 15.643 10 18 10H22" stroke="currentColor" strokeWidth="1.5" />
                  <path opacity="0.5" d="M7 14L6 15L7 16M11.5 16L12.5 17L11.5 18M10 14L8.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                EXCEL
              </button>
              {recordsData.length === 0 && (
                <span className="m-auto mb-3 ml-2 inline-block h-6 w-6 animate-[spin_2s_linear_infinite] rounded-full border-8 border-[#f1f2f3] border-l-primary border-r-primary align-middle" />
              )}
            </Header>
            <div className="datatables">
              {isMounted && (
                <DataTable
                  noRecordsText=""
                  highlightOnHover
                  className="table-hover whitespace-nowrap"
                  records={filteredUsers}
                  totalRecords={initialRecords.length}
                  recordsPerPage={pageSize}
                  page={page}
                  onPageChange={(p) => setPage(p)}
                  recordsPerPageOptions={PAGE_SIZES}
                  onRecordsPerPageChange={setPageSize}
                  sortStatus={sortStatus}
                  onSortStatusChange={setSortStatus}
                  minHeight={200}
                  paginationText={({ from, to, totalRecords }) =>
                    `Showing  ${from} to ${to} of ${totalRecords} entries`
                  }
                  columns={[
                    {
                      accessor: "user_twitter",
                      title: "User Twitter",
                      titleClassName: "!w-0",
                      render: (
                        { _id, username, name, profile_image_url },
                        index
                      ) => (
                        <>
                        <div
                          key={index}
                          className="flex items-center gap-2 font-semibold max-w-[200px]"
                        >
                          <img
                            className="h-9 w-9 max-w-none rounded-md"
                            src={profile_image_url}
                            alt="avatar"
                            onError={(e: any) => {
                              e.target.onerror = null;
                            }}
                          />
                          <div>
                            <span className="inline-flex items-center whitespace-nowrap font-bold">
                              {name || username}
                            </span>
                            <br />
                            <Link href={`/details/${_id}`} target="_blank" className="whitespace-nowrap text-sm opacity-60 hover:cursor-pointer">
                              @{username}
                            </Link>
                          </div>
                        </div>
                        </>
                      ),
                    },
                    {
                      accessor: "addresses.injectiveAddress",
                      title: "Wallet Address",
                      titleClassName: "!w-0",
                      render: ({ addresses }, index) => (
                        <div key={index} className="flex gap-2 font-semibold">
                          {addresses.injectiveAddress}
                        </div>
                      ),
                    },
                    {
                      accessor: "created_at",
                      title: "Age",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ created_at }, index) => (
                        <div key={index} className="text-center">
                          {created_at ? <TimeAgo date={created_at} /> : "N/A"}
                        </div>
                      ),
                    },
                    {
                      accessor: "join_date",
                      title: "Join Date",
                      titleClassName: "!text-center",
                      render: ({ created_at }, index) => (
                        <div key={index} className="text-center">
                          {new Date(created_at).toLocaleDateString()}
                        </div>
                      ),
                    },
                    {
                      accessor: "invite_code",
                      title: "Invite Code",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ invite_code }, index) => (
                        <div key={index} className="text-center">
                          {invite_code}
                        </div>
                      ),
                    },
                    {
                      accessor: "boosts.count",
                      title: "Chips",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ boosts }, index) => (
                        <div key={index} className="text-center">
                          {boosts?.count || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "referral_code",
                      title: "Referral Code",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ referral_code }, index) => (
                        <div key={index} className="text-center">
                          {referral_code}
                        </div>
                      ),
                    },
                    {
                      accessor: "first_date_spent_chest",
                      title: "First Day Spent (chest)",
                      titleClassName: "!text-center",
                      render: ({ first_date_spent_chest }, index) => (
                        <div key={index} className="text-center">
                          {new Date(first_date_spent_chest as string).toLocaleDateString()}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_borrowed_xnj",
                      title: "Total Borrowed (XNJ)",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_borrowed_xnj }, index) => (
                        <div key={index} className="text-center">
                          {(total_borrowed_xnj
                            ? total_borrowed_xnj
                            : 0
                          ).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_collateral_inj",
                      title: "Total Collateral (INJ)",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_collateral_inj }, index) => (
                        <div key={index} className="text-center">
                          {(total_collateral_inj
                            ? total_collateral_inj
                            : 0
                          ).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "current_deb_xnj",
                      title: "Current Deb (XNJ)",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        { total_borrowed_xnj, total_repay_xnj },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {((total_borrowed_xnj || 0) - (total_repay_xnj || 0)).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "current_collateral_inj",
                      title: "Current Collateral (INJ)",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        { total_collateral_inj, total_repay_inj },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {((total_collateral_inj || 0) - (total_repay_inj || 0)).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "wallet.ELEM",
                      title: "Current Balance ELEM_Free",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ wallet }, index) => (
                        <div key={index} className="text-center">
                          {(wallet?.ELEM || 0).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "onchain_balances.balances.ELEM.balance",
                      title: "Current Balance ELEM_Onchain",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ onchain_balances }, index) => (
                        <div key={index} className="text-center">
                          {roundDown((ethers.formatEther(onchain_balances?.balances.ELEM.balance || 0)), 4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "onchain_balances.balances.INJ.balance",
                      title: "Current Balance INJ_Onchain",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ onchain_balances }, index) => (
                        <div key={index} className="text-center">
                          {roundDown((ethers.formatEther(onchain_balances?.balances.INJ.balance || 0)), 4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_elem_spent_free",
                      title: "ELEM Free Spent",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_elem_spent_free }, index) => (
                        <div key={index} className="text-center">
                          {(total_elem_spent_free || 0).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_elem_spent_onchain",
                      title: "ELEM Onchain Spent",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_elem_spent_onchain }, index) => (
                        <div key={index} className="text-center">
                          {(total_elem_spent_onchain || 0).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_elem_spent",
                      title: "Total ELEM Spent",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_elem_spent }, index) => (
                        <div key={index} className="text-center">
                          {(total_elem_spent || 0).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_earned_and_claimed",
                      title: "ELEM Farmed in Training",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ total_earned_and_claimed }, index) => (
                        <div key={index} className="text-center">
                          {(total_earned_and_claimed || 0).toFixed(4)}
                        </div>
                      ),
                    },
                    {
                      accessor: "LTV",
                      title: "Current LTV",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          total_borrowed_xnj,
                          total_repay_xnj,
                          total_collateral_inj,
                          total_repay_inj,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {(() => {
                            const debt =
                              (total_borrowed_xnj || 0) -
                              (total_repay_xnj || 0);
                            const collateral =
                              (total_collateral_inj || 0) -
                              (total_repay_inj || 0);
                            const value =
                              (debt * 0.05) / (collateral * INJ_price);
                            const showValue =
                              (!isNaN(value) ? value.toFixed(2) : "0.00") + "%";
                            return showValue.startsWith("0.")
                              ? showValue.slice(2, showValue.length)
                              : showValue;
                          })()}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_ninja",
                      title: "Total Ninja > LV 5",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          total_ninja,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {total_ninja || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_ninja_level",
                      title: "Total Ninja Level > LV 5",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          total_ninja_level,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {total_ninja_level || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "total_earn_speed_hour",
                      title: "Total Farming Speed",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          total_earn_speed_hour,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {total_earn_speed_hour || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "earned",
                      title: "Unclaimed farm ELEM",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          earned,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {earned || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "cheat_detected",
                      title: "Detected",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: (
                        {
                          akatsuki,
                        },
                        index
                      ) => (
                        <div key={index} className="text-center">
                          {akatsuki ? 'Akatsuki' : ''}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
