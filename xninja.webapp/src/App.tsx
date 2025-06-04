import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DiscordCallbackComponent from './pages/oauth/callback/discord';
import { useMeQuery } from './hooks/useMeQuery';
import Header from './components/Layouts/Header';

// pages
import Index from './pages/index';
import Quest from './pages/quest';
import Market from './pages/market';
import Profile from './pages/profile';

// sub pages
import InputReferralCode from './pages/subs/input_referral';
import GiveChest from './pages/subs/give_chest';
import SubLogin from './pages/subs/login';

function App() {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const { data: user, reload, loading } = useMeQuery('referral_code', 'default');

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.semidark]);

    if (loading) return null;

    if (!user) return <SubLogin />;

    if (!user.referral_code) return <InputReferralCode reloadMe={reload} />;

    if (!user.user_ninjas || user.user_ninjas.length === 0) return <GiveChest reloadMe={reload} />;

    return (
        <>
            <div className="flex w-full h-full bg-white absolute justify-center">
                <div className="w-full max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                    <Router>
                        <Routes>
                            <Route path="/" element={
                                <>
                                    {themeConfig.showHeader && <Header />}
                                    <div className="main-container text-black">
                                        <div className="flex justify-center">
                                            <div className="flex flex-col">
                                                <Index />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            } />
                            <Route path="/quest" element={
                                <>
                                    {themeConfig.showHeader && <Header />}
                                    <div className="main-container text-black">
                                        <div className="flex justify-center">
                                            <div className="flex flex-col">
                                                <Quest />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            } />
                            <Route path="/market" element={
                                <>
                                    {themeConfig.showHeader && <Header />}
                                    <div className="main-container text-black">
                                        <div className="flex justify-center">
                                            <div className="flex flex-col">
                                                <Market />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            } />
                            <Route path="/profile" element={
                                <>
                                    {themeConfig.showHeader && <Header />}
                                    <div className="main-container text-black">
                                        <div className="flex justify-center">
                                            <div className="flex flex-col">
                                                <Profile />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            } />
                            <Route path="/oauth/callback/discord" element={<DiscordCallbackComponent />} />
                        </Routes>
                    </Router>
                </div>
            </div>
        </>
    );
}

export default App;
