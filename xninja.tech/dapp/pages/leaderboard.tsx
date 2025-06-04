import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GetServerSidePropsContext } from 'next';
import Database from '@/libs/database';
import { JWT } from 'next-auth/jwt';
import { setShowHeader } from '@/store/themeConfigSlice';
import toast, { Toaster } from 'react-hot-toast';
import { formatPriceNumber } from '@/libs/custom';

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');

    const user = (await getSession({ req }))?.user as JWT;

    const props: { serverStatus: number; users?: any } = { serverStatus: 200 };

    if (user) {
        const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { referral_code: 1, admin: 1 } });
        if (!dbUser) {
            props.serverStatus = 403;
        } else if (!dbUser.admin) {
            props.serverStatus = 202;
        }
    } else props.serverStatus = 403;

    if (props.serverStatus === 200) {
        const users = await userCollection
            .aggregate([
                {
                    $project: {
                        _id: 0,
                        username: 1,
                        user_refs: 1,
                    },
                },
            ])
            .toArray();

        users.sort((a, b) => (b.user_refs?.length || 0) - (a.user_refs?.length || 0));

        props.users = JSON.stringify(users);
    }

    return { props };
}

const Index = ({ serverStatus, users }: { serverStatus: number; users?: any }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    //@ts-ignore
    const { data: session, status }: Seesion = useSession();
    const [_users] = useState<{ username: string; user_refs: { rewards: { ELEM: number } }[] }[]>(users && JSON.parse(users));

    useEffect(() => {
        toast.remove();

        dispatch(setShowHeader(false));
    }, []);

    useEffect(() => {
        if (serverStatus !== 200) {
            router.push('/');
        }
    }, [serverStatus]);

    return (
        session && (
            <>
                <div className="flex flex-col">
                    <div className="panel flex w-full rounded-xl !bg-dark">
                        <span className="w-[50%] text-sm text-white">Total users: </span>
                        <div className="flex w-full justify-end text-white">
                            <span className="font-lg mr-1">{_users?.length || 0}</span>{' '}
                        </div>
                    </div>
                    <div className="panel mt-10 flex flex-col w-full rounded-xl text-white !bg-dark">
                        <span className="text-base font-black">Overview</span>
                        <div className="max-w-[360px]">
                            <div className="table-responsive mb-5 h-64 max-h-64 overflow-y-auto scrollbar-hide">
                                <table className="table-hover">
                                    <thead className="sticky top-0">
                                        <tr>
                                            <th className="text-xs bg-dark">User</th>
                                            <th className="text-xs bg-dark">Referrals count</th>
                                            <th className="text-xs bg-dark text-center">Referrals reward</th>
                                        </tr>
                                    </thead>
                                    <tbody className="h-56 max-h-56 overflow-y-auto scrollbar-hide">
                                        {_users?.map((data, index: number) => {
                                            return (
                                                <tr key={index}>
                                                    <td className="text-xs">@{data.username}</td>
                                                    <td className="text-xs">
                                                        <div className="whitespace-nowrap">{data.user_refs?.length || 0}</div>
                                                    </td>
                                                    <td className="text-xs">
                                                        <div className="flex">
                                                            <img className="w-6 mr-1" src="/assets/images/ELEM.png" alt="" />
                                                            <span className={`flex items-center font-bold text-white font-pixel`}>
                                                                {formatPriceNumber(data.user_refs?.reduce((prev, current) => prev + (current?.rewards?.ELEM || 0), 0) || 0)}
                                                            </span>
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
            </>
        )
    );
};

export default Index;
