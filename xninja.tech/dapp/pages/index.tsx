import { getSession, signOut, useSession } from 'next-auth/react';
import { Login } from './login';
import Database from '@/libs/database';
import { JWT } from 'next-auth/jwt';
import { GetServerSidePropsContext } from 'next';
import InvitePage from '@/components/input_invite';
import { useDispatch } from 'react-redux';
import { setShowHeader } from '@/store/themeConfigSlice';
import { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import MyBag from '@/components/my_bag';
import { LEVEL_NINJAS, CONFIG_BOOSTS } from '@/libs/game.config';
import toast, { Toaster } from 'react-hot-toast';
import { formatPriceNumber } from '@/libs/custom';

interface Seesion {
    data: {
        user?: {
            tw_id: string;
            name: string;
            username: string;
            profile_image_url: string;
            addresses: { injectiveAddress: string; ethereumAddress: string };
            two_factor_enabled: boolean;
            wallet: { ELEM: number };
            discordId: string;
            boosts: { count: number; date: Date };
        };
        expries: string;
    };
    status: 'authenticated' | 'loading' | 'unauthenticated';
}

interface UserNinja {
    _id: ObjectId;
    class: string;
    level: number;
    mana: Date;
    created_at: Date;
}

function getBoostData(boosts: { count: number; date: Date } | undefined) {
    if (!boosts) return null;

    const currentDate = new Date();

    const sortedKeys = Object.keys(CONFIG_BOOSTS)
        .map(Number)
        .sort((a, b) => a - b);

    for (let i = 0; i < sortedKeys.length; i++) {
        if (boosts.count < sortedKeys[i]) {
            const data = CONFIG_BOOSTS[sortedKeys[i - 1]];

            return data && (currentDate.getTime() - boosts.date.getTime()) / (24 * 60 * 60 * 1000) < data.day ? data.boost : null;
        }
    }

    return CONFIG_BOOSTS[sortedKeys[sortedKeys.length - 1]].boost;
}

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const ninjaCollection = db.collection('ninjas');

    const user = (await getSession({ req }))?.user as JWT;

    const props: { serverStatus: number; userNinjas?: string } = { serverStatus: 200 };

    if (user) {
        const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { referral_code: 1, ninjas: 1 } });

        if (!dbUser) {
            props.serverStatus = 403;
        } else if (!dbUser.referral_code) {
            props.serverStatus = 202;
        }

        if (props.serverStatus === 200 && dbUser?.ninjas) {
            const userNinjas = (await ninjaCollection
                .find({ _id: { $in: dbUser.ninjas.map((id: string) => new ObjectId(id)) } })
                .project({ ownerId: 0 })
                .toArray()) as UserNinja[];

            props.userNinjas = JSON.stringify(userNinjas);
        }
    } else props.serverStatus = 403;

    return { props };
}

const Index = ({ serverStatus, userNinjas }: { serverStatus: number; userNinjas: string }) => {
    const dispatch = useDispatch();
    //@ts-ignore
    const { data: session, status }: Seesion = useSession();
    const [ninjas, setNinjas] = useState<any[]>(userNinjas ? JSON.parse(userNinjas) : []);
    const [wallet, setWallet] = useState(session?.user?.wallet);
    const [ninja, setNinja] = useState(ninjas && ninjas[0]);
    const [showBag, setShowBag] = useState<boolean>(false);

    useEffect(() => {
        toast.remove();
        dispatch(setShowHeader(true));

        //@ts-ignore
        getSession().then((session: Seesion) => setWallet(session?.user?.wallet || { ELEM: 0 }));
    }, []);

    const [farmData, setFarmData] = useState(() => {
        const now = Date.now();

        return ninjas.reduce(
            (previousValue, currentValue) => {
                let earned = 0;
                let total_earn_speed_hour = 0;

                const farm_at = Date.parse(currentValue.farm_at);
                const mana = Date.parse(currentValue.mana);
                const balance = currentValue.balance;
                const _class = currentValue.class;
                const level = currentValue.level;
                const boost = getBoostData(session?.user?.boosts) || 0;

                if (farm_at) {
                    if (now >= mana) {
                        if (LEVEL_NINJAS[_class][level]) {
                            const balance = ((mana - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                            earned += balance + (balance * boost) / 100;
                        }
                    } else {
                        if (LEVEL_NINJAS[_class][level]) {
                            const balance = ((now - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                            earned += balance + (balance * boost) / 100;
                        }
                        total_earn_speed_hour += LEVEL_NINJAS[_class][level].farm_speed_hour;
                    }
                }

                earned += balance || 0;

                return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
            },
            { earned: 0, total_earn_speed_hour: 0 },
        );
    });

    useEffect(() => {
        let intervalId: undefined | NodeJS.Timeout;

        if (!showBag) {
            const now = Date.now();

            const { earned, total_earn_speed_hour } = ninjas.reduce(
                (previousValue, currentValue) => {
                    let earned = 0;
                    let total_earn_speed_hour = 0;

                    const farm_at = Date.parse(currentValue.farm_at);
                    const mana = Date.parse(currentValue.mana);
                    const balance = currentValue.balance;
                    const _class = currentValue.class;
                    const level = currentValue.level;
                    const boost = getBoostData(session?.user?.boosts) || 0;

                    if (farm_at) {
                        if (now >= mana) {
                            if (LEVEL_NINJAS[_class][level]) {
                                const balance = ((mana - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                                earned += balance + (balance * boost) / 100;
                            }
                        } else {
                            if (LEVEL_NINJAS[_class][level]) {
                                const balance = ((now - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                                earned += balance + (balance * boost) / 100;
                            }
                            total_earn_speed_hour += LEVEL_NINJAS[_class][level].farm_speed_hour;
                        }
                    }

                    earned += balance || 0;

                    return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
                },
                { earned: 0, total_earn_speed_hour: 0 },
            );

            setFarmData({ earned, total_earn_speed_hour });
            intervalId = setInterval(() => {
                const now = Date.now();

                const { earned, total_earn_speed_hour } = ninjas.reduce(
                    (previousValue, currentValue) => {
                        let earned = 0;
                        let total_earn_speed_hour = 0;

                        const farm_at = Date.parse(currentValue.farm_at);
                        const mana = Date.parse(currentValue.mana);
                        const balance = currentValue.balance;
                        const _class = currentValue.class;
                        const level = currentValue.level;
                        const boost = getBoostData(session?.user?.boosts) || 0;

                        if (farm_at) {
                            if (now >= mana) {
                                if (LEVEL_NINJAS[_class][level]) {
                                    const balance = ((mana - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                                    earned += balance + (balance * boost) / 100;
                                }
                            } else {
                                if (LEVEL_NINJAS[_class][level]) {
                                    const balance = ((now - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                                    earned += balance + (balance * boost) / 100;
                                }
                                total_earn_speed_hour += LEVEL_NINJAS[_class][level].farm_speed_hour;
                            }
                        }

                        earned += balance || 0;

                        return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
                    },
                    { earned: 0, total_earn_speed_hour: 0 },
                );

                setFarmData({ earned, total_earn_speed_hour });
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [ninjas, showBag]);

    if (serverStatus === 202) {
        dispatch(setShowHeader(false));
        return <InvitePage />;
    }

    if (serverStatus === 403) {
        dispatch(setShowHeader(false));
        return <Login />;
    }

    if (status !== 'loading' && (status === 'unauthenticated' || !session)) return <Login />;

    return (
        status === 'authenticated' &&
        session && (
            <>
                {showBag && (
                    <div className="w-full h-full max-h-[800px] max-w-[500px] bg-white absolute z-10">
                        <MyBag
                            closeBag={() => setShowBag(false)}
                            onUse={(item) => {
                                const _id = ninja._id;

                                if (!_id) return;

                                axios
                                    .post('/api/game/feed', { id: _id, item })
                                    .then((response) => {
                                        setNinja((prev: any) => ({ ...prev, mana: response.data.ninja.mana, farm_at: response.data.ninja.unset_farm_at ? null : prev.farm_at }));
                                        setNinjas((prev: any) =>
                                            prev.map((v: any) => (v._id === _id ? { ...v, mana: response.data.ninja.mana, farm_at: response.data.ninja.unset_farm_at ? null : v.farm_at } : v)),
                                        );
                                        toast.success('Feed successfully!', { duration: 3000, className: 'font-pixel text-black' });
                                    })
                                    .catch((error) => {
                                        error.response.status === 403 && signOut({ callbackUrl: '/' });
                                    })
                                    .finally(() => {
                                        setShowBag(false);
                                        dispatch(setShowHeader(true));
                                    });
                            }}
                        />
                    </div>
                )}
                <div className="mb-2 flex items-center overflow-y-auto border-b border-white-light font-semibold">
                    <div className="flex w-full mb-2">
                        <div className="flex w-full">
                            <div className="mr-2 ml-4 flex w-full">
                                <div className="w-8 mr-1">
                                    <img src={`/assets/images/ELEM.png`} alt="" />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm text-black`}>{formatPriceNumber(wallet?.ELEM || 0)}</span>
                                    <span className="text-xs">$ELEM</span>
                                </div>
                            </div>
                            <div className="flex w-full justify-end">
                                {/* <div className="mr-4 mt-2 w-[60px] hover:cursor-pointer" onClick={() => setShowBag(true)}>
                                    <div className="flex items-center">
                                        <img className="w-5 mr-1" src="/assets/images/chip.svg" alt="" />
                                        <span className="text-md opacity-[0.9] font-pixel">{session.user?.boosts.count || 0}</span>
                                    </div>
                                </div> */}
                                <div className="mr-4 w-[60px] hover:cursor-pointer" onClick={() => setShowBag(true)}>
                                    <div className="flex flex-col items-center">
                                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M9 2.72327H15V4.72327H9V2.72327ZM15 6.72327V4.72327H17V6.72327H21V8.72327V20.7233V22.7233H19H5H3V20.7233V8.72327V6.72327H7V4.72327H9V6.72327H15ZM15 8.72327H9V10.7233H7V8.72327H5V20.7233H19V8.72327H17V10.7233H15V8.72327Z"
                                                fill="black"
                                            />
                                        </svg>
                                        <span className="text-xs opacity-[0.8] font-pixel">My Bag</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {status === 'authenticated' && session && (
                    <div className="flex justify-center items-center">
                        <img className="m-auto mt-4 w-[380px]" src="/assets/images/home-place.png" />
                    </div>
                )}
                <div className="relative p-6 sm:p-8 mt-2 max-w-[380px] text-center text-center">
                    <h1 className="font-display text-2xl font-normal tracking-tight font-pixel">WELCOME TO XNINJA</h1>
                    <p className="mt-4 text-base tracking-tigh leading-6 font-pixel">
                        Our quests are now open for Ninjas to earn $ELEM - convertible into $XNJ or using as currency to buy chest, food or upgrade your ninjas.
                    </p>
                    <p className="mt-4 text-base tracking-tigh leading-6 font-pixel">Open tab “Quest” to step into xNinja world!</p>
                </div>
                <Toaster />
            </>
        )
    );
};

export default Index;
