import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Login = () => {
    return (
        <div className="mt-10 flex flex-col items-center">
            <img src="/assets/images/logo.png" width={200} height={200} />
            <span className="text-center text-xl font-bold mt-10">Train your Ninja, Fight & Take profit on Twitter</span>
            <button className="mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90" onClick={() => signIn('twitter')}>
                Sign in
            </button>
        </div>
    );
};

const Index = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status]);

    return status !== 'loading' && <Login />;
};

export default Index;
