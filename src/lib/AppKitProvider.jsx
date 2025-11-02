// src/lib/AppKitProvider.jsx
import React from 'react'
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import {
  mantle, mainnet, polygon, arbitrum, base, optimism, bsc, avalanche,
  solana, solanaTestnet, bitcoin, bitcoinTestnet
} from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'

// 1) WalletConnect / Reown Cloud project ID
const projectId = 'b1b4be2183b2cb322d11e2b0c098a425'

// 2) Networks
const evmNetworks = [mantle, mainnet, polygon, arbitrum, base, optimism, bsc, avalanche]
const solNetworks = [solana, solanaTestnet]
const btcNetworks = [bitcoin, bitcoinTestnet]

// 3) Adapters
const wagmiAdapter = new WagmiAdapter({ projectId, networks: evmNetworks })
const solanaAdapter = new SolanaAdapter({})
const bitcoinAdapter = new BitcoinAdapter({})

// Export wagmiConfig for hooks (useAccount, etc.)
export const wagmiConfig = wagmiAdapter.wagmiConfig

// 4) Metadata for AppKit modal
const metadata = {
  name: 'NeonVault',
  description: 'Creative wallet-gated site',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  icons: ['https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4b0.svg']
}

// 5) Create AppKit modal
export const appKit = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
  networks: [...evmNetworks, ...solNetworks, ...btcNetworks],
  projectId,
  metadata,
  features: { analytics: true },
  defaultAccountTypes: {
    eip155: 'eoa',    // EVM
    solana: 'wallet', // Solana
    bip122: 'payment' // Bitcoin
  }
})

// 6) Helper functions (use these in React components)
export function openConnectModal() {
  appKit.open()
}
export function openNetworkModal() {
  appKit.open({ view: 'Networks' })
}

// 7) Provider component
export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
    </WagmiProvider>
  )
}
