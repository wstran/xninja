import type { AppProps } from 'next/app';
import { ReactElement, ReactNode, Suspense, useEffect, useState } from 'react';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { Provider } from 'react-redux';
import store from '../store/index';
import Head from 'next/head';

import { appWithI18Next } from 'ni18n';
import { ni18nConfig } from 'ni18n.config.ts';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

import '../styles/tailwind.css';
/* import "@mantine/core/styles.css"; */
import { NextPage } from 'next';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

import { SessionProvider } from "next-auth/react"

import { ContextProvider } from '../context'; 
/* import { createTheme, MantineProvider } from '@mantine/core';
const theme = createTheme({}); */
const App = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        setReady(true);
      }, []);

    const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

    return (
      <>
        {ready ? (
          <ContextProvider>
            <SessionProvider session={session} refetchInterval={0}>
             {/*  <MantineProvider theme={{ ...theme }} defaultColorScheme="light"> */}
                <Provider store={store}>
                  <Head>
                    <title>x</title>
                    <meta charSet="UTF-8" />
                    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta name="description" content="" />
                    <link rel="icon" href="/favicon.ico" />
                  </Head>

                  {getLayout(<Component {...pageProps} />)}
                </Provider>
           {/*    </MantineProvider> */}
            </SessionProvider>
          </ContextProvider>
        ) : null}
      </>
    );
};
export default appWithI18Next(App, ni18nConfig);
