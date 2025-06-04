import { getSession } from 'next-auth/react'
import { NextPageContext } from 'next'
import { useProtected } from '../../hooks/useProtected'

function Protected() {
  const handleLogout = useProtected()

  return (
    <>
      <div>
          We are now connected using our metamask account and can access
          connected routes. However, users can manually disconnect from the
          Metamask interface. To make sure we log them out, we can create a
          custom hook.
      </div>
      <button onClick={handleLogout}>Logout</button>
    </>
  )
}

export default Protected

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context)
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  return {
    props: {},
  }
}
