import { useEffect, useState } from 'react';
import { useMeQuery } from '../../hooks/useMeQuery';
import { Darts } from '../darts';
import Header from './Header';
import { useSelector } from 'react-redux';
// pages
import Index from '../../pages/index';
import Quest from '../../pages/quest';
import Market from '../../pages/market';
import Profile from '../../pages/profile';

// sub pages
import InputReferralCode from '../../pages/subs/input_referral';
import SubLogin from '../../pages/subs/login';
import GiveChest from '../../pages/subs/give_chest';
import { IRootState } from '../../store';

const Routes = {
    '/': Index,
    '/quest': Quest,
    '/market': Market,
    '/profile': Profile,
};

const Setting = () => {
    const [showCustomizer, setShowCustomizer] = useState(Boolean(Number(localStorage.getItem('xninja-customizer'))));
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const { data: user, reload, loading } = useMeQuery('referral_code', 'default');
    const [route, setRoute] = useState<'/' | '/quest' | '/market' | '/profile'>('/');

    useEffect(() => {
        if (!localStorage.getItem('xninja-customizer')) {
            localStorage.setItem('xninja-customizer', '1');
            setShowCustomizer(true);
        };
    }, []);

    const Route = Routes[route];

    if (loading) return null;

    if (!user) return (
        <div>
            <nav
                className={`${(showCustomizer && 'ltr:!right-0 rtl:!left-0') || ''
                    } bg-white fixed ltr:-right-[530px] rtl:-left-[530px] top-0 bottom-0 w-full max-w-[530px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 z-[51] p-4`}
            >
                <button
                    type="button"
                    className="ltr:rounded-tl-full rtl:rounded-tr-full ltr:rounded-bl-full rtl:rounded-br-full absolute ltr:-left-12 rtl:-right-12 top-64 bottom-0 w-12 h-10 flex justify-center items-center text-white cursor-pointer"
                    onClick={() => {
                        setShowCustomizer(!showCustomizer);
                        localStorage.setItem('xninja-customizer', showCustomizer ? '0' : '1');
                    }}
                >
                    <Darts width={36} height={36} />
                </button>
                <div className="overflow-y-auto overflow-x-hidden scrollbar-hide h-full">
                    <SubLogin setRoute={setRoute} />
                </div>
            </nav>
        </div>
    );

    if (!user.referral_code) return (
        <div>
            <nav
                className={`${(showCustomizer && 'ltr:!right-0 rtl:!left-0') || ''
                    } bg-white fixed ltr:-right-[530px] rtl:-left-[530px] top-0 bottom-0 w-full max-w-[530px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 z-[51] p-4`}
            >
                <button
                    type="button"
                    className="ltr:rounded-tl-full rtl:rounded-tr-full ltr:rounded-bl-full rtl:rounded-br-full absolute ltr:-left-12 rtl:-right-12 top-64 bottom-0 w-12 h-10 flex justify-center items-center text-white cursor-pointer"
                    onClick={() => {
                        setShowCustomizer(!showCustomizer);
                        localStorage.setItem('xninja-customizer', showCustomizer ? '0' : '1');
                    }}
                >
                    <Darts width={36} height={36} />
                </button>
                <div className="overflow-y-auto overflow-x-hidden scrollbar-hide h-full">
                    <InputReferralCode reloadMe={reload} />
                </div>
            </nav>
        </div>
    );

    if (!user.user_ninjas || user.user_ninjas.length === 0) return (
        <div>
            <nav
                className={`${(showCustomizer && 'ltr:!right-0 rtl:!left-0') || ''
                    } bg-white fixed ltr:-right-[530px] rtl:-left-[530px] top-0 bottom-0 w-full max-w-[530px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 z-[51] p-4`}
            >
                <button
                    type="button"
                    className="ltr:rounded-tl-full rtl:rounded-tr-full ltr:rounded-bl-full rtl:rounded-br-full absolute ltr:-left-12 rtl:-right-12 top-64 bottom-0 w-12 h-10 flex justify-center items-center text-white cursor-pointer"
                    onClick={() => {
                        setShowCustomizer(!showCustomizer);
                        localStorage.setItem('xninja-customizer', showCustomizer ? '0' : '1');
                    }}
                >
                    <Darts width={36} height={36} />
                </button>
                <div className="overflow-y-auto overflow-x-hidden scrollbar-hide h-full">
                    <GiveChest reloadMe={reload} />
                </div>
            </nav>
        </div>
    );

    return (
        <div>
            <nav
                className={`${(showCustomizer && 'ltr:!right-0 rtl:!left-0') || ''
                    } bg-white fixed ltr:-right-[530px] rtl:-left-[530px] top-0 bottom-0 w-full max-w-[530px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 z-[51] p-4`}
            >
                <button
                    type="button"
                    className="ltr:rounded-tl-full rtl:rounded-tr-full ltr:rounded-bl-full rtl:rounded-br-full absolute ltr:-left-12 rtl:-right-12 top-64 bottom-0 w-12 h-10 flex justify-center items-center text-white cursor-pointer"
                    onClick={() => {
                        setShowCustomizer(!showCustomizer);
                        localStorage.setItem('xninja-customizer', showCustomizer ? '0' : '1');
                    }}
                >
                    <Darts width={36} height={36} />
                </button>
                <div className="overflow-y-auto overflow-x-hidden scrollbar-hide h-full">
                    {themeConfig.showHeader && <Header route={route} setRoute={setRoute} />}
                    {
                        <div className="relative">
                            <div className={`main-container text-black`}>
                                <div className="flex justify-center">
                                    <div className="flex flex-col">
                                        <Route setRoute={setRoute} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </nav>
        </div>
    );
};

export default Setting;
