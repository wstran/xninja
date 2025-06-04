import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { usePrevious } from './usePrevious'

export function useProtected() {
  const { address, isConnected } = useAccount();
  const { data: session, status: session_status } = useSession()
  const prevAddress = usePrevious(address)
  const { disconnectAsync } = useDisconnect();

  const handleSignout = async () => {
    if(session_status === 'authenticated') {
      await signOut();
    }
    disconnectAsync;
  };

  useEffect(() => {
    if (prevAddress && !address) {
      handleSignout()
    }
    if (session_status !== 'loading' && !address && prevAddress) {
      handleSignout()
    }
  }, [address])

  return handleSignout
}
