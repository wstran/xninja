import type { AppProps } from 'next/app';
import { ReactElement, ReactNode } from 'react';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { Provider } from 'react-redux';
import store from '../store/index';
import { SessionProvider } from 'next-auth/react';
import { ChakraProvider } from '@chakra-ui/react'

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

import '../styles/tailwind.css';
import { NextPage } from 'next';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

const App = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) => {
    const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

    return (
        <SessionProvider session={session}>
            <Provider store={store}>{getLayout(<ChakraProvider><Component {...pageProps} /></ChakraProvider>)}</Provider>
        </SessionProvider>
    );
};

export default App;
