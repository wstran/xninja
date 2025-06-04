import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'

import { cookieStorage, createStorage } from 'wagmi'
import { mainnet } from 'wagmi/chains'

export const projectId = '6baa38bdee19563c00df5792f2752ce9'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'xNinja',
  description: 'xNinja.Tech',
  url: 'https://hokage-fff-yyy-zk88.xninja.tech/',
  icons: ['https://xninja.s3.ap-southeast-1.amazonaws.com/images/logo_token_xnj.png']
}

// Create wagmiConfig
export const config = defaultWagmiConfig({
  chains: [mainnet], // required
  projectId, // required
  metadata, // required
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableWalletConnect: true, // Optional - true by default
  enableInjected: true, // Optional - true by default
  enableEIP6963: true, // Optional - true by default
  enableCoinbase: true, // Optional - true by default
//   ...wagmiOptions // Optional - Override createConfig parameters
})