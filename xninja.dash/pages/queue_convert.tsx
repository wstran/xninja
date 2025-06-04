import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../store/themeConfigSlice";
import { useSession } from "next-auth/react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import axios from "axios";
import Link from "next/link";
import { downloadExcel } from 'react-export-table-to-excel';

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
  user_id: string;
  status: string;
  tw_id: string;
  akatsuki: boolean;
  amount: number;
  created_at: string;
  success_at: string;
};

const Index = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle("Home"));
  });
  const { data: session } = useSession();

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100, 500];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState<Users[]>([]);
  const [recordsData, setRecordsData] = useState(initialRecords);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "created_at",
    direction: "desc",
  });

  useEffect(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    axios
      .get("/api/queue_tables")
      .then((response) => {
        setInitialRecords(response.data.queue_converts);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const records = [...initialRecords];
    records.sort((a: { [key: string]: any }, b: { [key: string]: any }) => {
      if (sortStatus.columnAccessor === "created_at") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortStatus.columnAccessor === "success_at") {
        return new Date(a.success_at).getTime() - new Date(b.success_at).getTime();
      }
      return (a[sortStatus.columnAccessor] || 0) - (b[sortStatus.columnAccessor] || 0);
    });

    setInitialRecords(sortStatus.direction === "desc" ? records.reverse() : records);
    setPage(1);
  }, [sortStatus]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  const filteredUsers = useMemo(() => {
    return recordsData;
  }, [recordsData]);

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
                      accessor: "tw_id",
                      title: "tw_id",
                      titleClassName: "!w-0",
                      render: ({ tw_id, user_id }, index) => (
                        <div key={index} className="flex gap-2 font-semibold">
                          <Link
                            href={`/details/${user_id}`}
                            target="_blank"
                            className="whitespace-nowrap text-sm opacity-60 hover:cursor-pointer"
                          >
                            {tw_id}
                          </Link>
                        </div>
                      ),
                    },
                    {
                      accessor: "akatsuki",
                      title: "Akatsuki",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ akatsuki }, index) => (
                        <div key={index} className="text-center">
                          {akatsuki ? "YES" : "NO"}
                        </div>
                      ),
                    },
                    {
                      accessor: "amount",
                      title: "Amount",
                      titleClassName: "!text-center",
                      render: ({ amount }, index) => (
                        <div key={index} className="text-center">
                          {amount || 0}
                        </div>
                      ),
                    },
                    {
                      accessor: "created_at",
                      title: "Created at",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ created_at }, index) => (
                        <div key={index} className="text-center">
                          {new Date(created_at as string).toLocaleString()}
                        </div>
                      ),
                    },
                    {
                      accessor: "success_at",
                      title: "Success at",
                      titleClassName: "!text-center",
                      sortable: true,
                      render: ({ success_at }, index) => (
                        <div key={index} className="text-center">
                          {new Date(success_at as string).toLocaleString()}
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
