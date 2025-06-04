import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Login = () => {
    return (
        <div className='flex flex-col mt-10 items-center'>
            <img src='/assets/images/logo.png' width={200} height={200}/>
            <span className='font-bold text-2xl'>Train your Ninja, Fight & Take profit on Twitter</span>
            <button className='font-bold text-xl rounded-full text-white bg-white-light p-2 px-5 hover:bg-white-light/90 dark:bg-dark dark:hover:bg-dark/60 mt-10 w-[500px] h-[50px]' onClick={() => signIn('twitter')}>Sign in</button>
        </div>
    );
};

const Index = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        };
    }, [status]);

    return (
        status !== 'loading' && <Login/>
    );
};

export default Index;
