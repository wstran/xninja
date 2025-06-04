import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function TimeAgo({ date }: { date: Date }) {
    const [timeAgo, setTimeAgo] = useState(() => calculateTimeDifference(date, new Date()));

    useEffect(() => {
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
};

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
            <label className="mt-1 flex items-center w-[250px]">
                <input type="text" className="form-input rounded border p-2" placeholder={placeholder} onChange={(e) => onSearch(e.target.value)} />
            </label>
        </div>
    </div>
);

type Users = {
    addresses: { injectiveAddress: string }, boosts?: { count: number }, username: string; name: string; profile_image_url: string; created_at: Date; invite_code: string; last_login: Date; wallet: { ELEM: number }; referral_code: string; total_borrowed_xnj?: number;
    total_collateral_inj?: number; total_repay_xnj?: number; total_repay_inj?: number; total_earned?: number; first_date_spent?: Date; total_spent_elem_offchain?: number;
};

const Index = () => {
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Users[]>([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [isMounted, setIsMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });
    const [INJ_price, setINJ_price] = useState(0.0);

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
        return initialRecords
            .filter((user: any) => {
                return user.username?.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .slice(0, pageSize);
    }, [recordsData, searchTerm, initialRecords]);

    return (
        <div className="panel">
            <Header firstContent='Overview' content="Users" placeholder="Search Users (username)..." onSearch={setSearchTerm}>
                {recordsData.length === 0 && (
                    <span className="m-auto mb-1 ml-2 inline-block h-6 w-6 animate-[spin_2s_linear_infinite] rounded-full border-8 border-[#f1f2f3] border-l-primary border-r-primary align-middle" />
                )}
            </Header>
            <div className="datatables">
                {isMounted && (
                    <DataTable
                        noRecordsText="No results match your search query"
                        highlightOnHover
                        className="table-hover whitespace-nowrap"
                        records={filteredUsers}
                        columns={[
                            {
                                accessor: 'id',
                                title: 'id',
                                render: ({ addresses: { injectiveAddress } }, index) => (
                                    <div key={index} className="flex items-center gap-2 font-semibold">
                                        {injectiveAddress}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'account_name',
                                title: 'account_name',
                                render: ({ username, name, profile_image_url }, index) => (
                                    <div key={index} className="flex items-center gap-2 font-semibold">
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
                                            <a className="whitespace-nowrap text-sm opacity-60 hover:cursor-pointer">@{username}</a>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'wallet.ELEM',
                                title: 'wallet.ELEM',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ wallet }, index) => (
                                    <div key={index} className='text-center'>
                                        {wallet?.ELEM || 0}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'boosts.count',
                                title: 'Chips',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ boosts }, index) => (
                                    <div key={index} className='text-center'>
                                        {boosts?.count || 0}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'invite_code',
                                title: 'invite_code',
                                titleClassName: '!text-center',
                                render: ({ invite_code }, index) => (
                                    <div key={index} className='text-center'>
                                        {invite_code}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'referral_code',
                                title: 'referral_code',
                                titleClassName: '!text-center',
                                render: ({ referral_code }, index) => (
                                    <div key={index} className='text-center'>
                                        {referral_code}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'LTV',
                                title: 'LTV',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_borrowed_xnj, total_repay_xnj, total_collateral_inj, total_repay_inj }, index) => (
                                    <div key={index} className='text-center'>
                                        {(() => {
                                            const debt = (total_borrowed_xnj || 0) - (total_repay_xnj || 0);
                                            const collateral = (total_collateral_inj || 0) - (total_repay_inj || 0);
                                            const value = (debt * 0.05) / (collateral * INJ_price);
                                            const showValue = (!isNaN(value) ? value.toFixed(2) : '0.00') + '%';
                                            return showValue.startsWith('0.') ? showValue.slice(2, showValue.length) : showValue;
                                        })()}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'total_borrowed',
                                title: 'total_borrowed_xnj',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_borrowed_xnj }, index) => (
                                    <div key={index} className='text-center'>
                                        {total_borrowed_xnj ? total_borrowed_xnj : '0'}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'total_collateral_inj',
                                title: 'total_collateral_inj',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_collateral_inj }, index) => (
                                    <div key={index} className='text-center'>
                                        {total_collateral_inj ? total_collateral_inj : '0'}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'current_collateral_xnj',
                                title: 'current_collateral_xnj',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_borrowed_xnj, total_repay_xnj }, index) => (
                                    <div key={index} className='text-center'>
                                        {(total_borrowed_xnj || 0) - (total_repay_xnj || 0)}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'current_collateral_inj',
                                title: 'current_collateral_inj',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_collateral_inj, total_repay_inj }, index) => (
                                    <div key={index} className='text-center'>
                                        {(total_collateral_inj || 0) - (total_repay_inj || 0)}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'total_spent_elem_offchain',
                                title: 'total_spent_elem_offchain',
                                titleClassName: '!text-center',
                                sortable: true,
                                render: ({ total_spent_elem_offchain }, index) => (
                                    <div key={index} className='text-center'>
                                        {total_spent_elem_offchain || '0'}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'first_date_spent',
                                title: 'first_date_spent',
                                titleClassName: '!text-center',
                                render: ({ first_date_spent }, index) => (
                                    <div key={index} className='text-center'>
                                        {first_date_spent ? <TimeAgo date={first_date_spent} /> : 'N/A'}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'last_login',
                                title: 'last_login',
                                titleClassName: '!text-center',
                                render: ({ last_login }, index) => (
                                    <div key={index} className='text-center'>
                                        {last_login ? <TimeAgo date={last_login} /> : 'N/A'}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'created_at',
                                title: 'created_at',
                                titleClassName: '!text-center',
                                render: ({ created_at }, index) => (
                                    <div key={index} className='text-center'>
                                        {created_at ? <TimeAgo date={created_at} /> : 'N/A'}
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                )}
            </div>
        </div>
    );
};

export default Index;