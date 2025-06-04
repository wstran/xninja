import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Login } from './login';

const Index = () => {
    const { data: session, status } = useSession();

    return (
        status !== 'loading' && (
            <>
                {(status === 'authenticated' && session) && (
                    <>
                        <div onClick={() => signOut()}>
                            Logout
                        </div>
                    </>
                )}
                {(status === 'unauthenticated' || !session) && <Login />}
            </>
        )
    );
};

export default Index;
