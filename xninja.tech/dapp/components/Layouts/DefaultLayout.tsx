import { IRootState } from '@/store';
import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import App from '../../App';
import Header from './Header';
import { useSession } from 'next-auth/react';

const DefaultLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const { status } = useSession();

    return (
        <App>
            <div className="relative">
                <div className={`${themeConfig.navbar} main-container min-h-screen text-black`}>
                    <div className="flex lg:justify-center">
                        <div className="flex min-h-screen flex-col">
                            {status === 'authenticated' && themeConfig.showHeader && <Header />}
                            <div className={`animate__animated p-4`}>{children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </App>
    );
};

export default DefaultLayout;
