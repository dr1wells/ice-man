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

// 1️⃣ WalletConnect / Reown Cloud Project ID
const projectId = 'd3b40e77692848407eb683bab403e3b9'

// 2️⃣ Networks
const evmNetworks = [mantle, mainnet, polygon, arbitrum, base, optimism, bsc, avalanche]
const solNetworks = [solana, solanaTestnet]
const btcNetworks = [bitcoin, bitcoinTestnet]

// 3️⃣ Adapters
const wagmiAdapter = new WagmiAdapter({ projectId, networks: evmNetworks })
const solanaAdapter = new SolanaAdapter({})
const bitcoinAdapter = new BitcoinAdapter({})

// Export wagmiConfig for hooks (useAccount, etc.)
export const wagmiConfig = wagmiAdapter.wagmiConfig

// 4️⃣ Metadata (⚠️ static domain required for mobile Trust Wallet)
const metadata = {
  name: 'NeonVault',
  description: 'Creative wallet-gated site',
  url: 'https://ice-man.vercel.app', // ✅ must exactly match your deployed Vercel domain
  icons: ['https://ice-man.vercel.app/favicon.svg'] // ✅ use your hosted favicon for consistency
}

// 5️⃣ Create AppKit modal
export const appKit = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
  networks: [...evmNetworks, ...solNetworks, ...btcNetworks],
  projectId,
  metadata,
  features: { analytics: true },
  defaultAccountTypes: {
    eip155: 'eoa',    // EVM wallets
    solana: 'wallet', // Solana wallets
    bip122: 'payment' // Bitcoin wallets
  }
})

// 6️⃣ Helper functions (use these in your React components)
export function openConnectModal() {
  appKit.open()
}

export function openNetworkModal() {
  appKit.open({ view: 'Networks' })
}

// 7️⃣ Provider component
export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
    </WagmiProvider>
  )
}
