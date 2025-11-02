// src/App.jsx
import React, { useEffect, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { openConnectModal, openNetworkModal } from './lib/AppKitProvider'
import { readErc20Balance } from './lib/erc20'
import { USDT } from './lib/tokens'
import { logNetworkChange, logWallet } from './api/log'
import { getEvmBalances } from './lib/evm' // ✅ imported
import ConnectModal from './components/ConnectModal'

function truncate(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : ''
}

export default function App() {
  const { address, status, isConnected } = useAccount()
  const chainId = useChainId()
  const [log, setLog] = useState('')
  const [showConnect, setShowConnect] = useState(false)
  const [balances, setBalances] = useState([])
  const [loadingBalances, setLoadingBalances] = useState(false)

  // 🧠 Wallet connection logs
  useEffect(() => {
    if (isConnected && address) logWallet('connected', address)
    else if (status === 'disconnected') logWallet('disconnected')
  }, [isConnected, status, address])

  // 🌐 Network change logs
  useEffect(() => {
    if (chainId) logNetworkChange({ id: chainId })
  }, [chainId])

  // 💰 Auto-fetch balances after wallet connects
  useEffect(() => {
    if (isConnected && address) {
      (async () => {
        console.log('🔍 Fetching balances for:', address)
        setLoadingBalances(true)
        try {
          const data = await getEvmBalances(address)
          setBalances(data || [])
          console.log('💰 EVM Balances:', data)
        } catch (err) {
          console.warn('Balance fetch error:', err.message)
        } finally {
          setLoadingBalances(false)
        }
      })()
    } else {
      setBalances([])
    }
  }, [isConnected, address])

  // 🔎 Manual read example for USDT (EVM only)
  async function onReadUSDT_EVM() {
    try {
      if (!isConnected) return setLog('Connect an EVM wallet first.')
      const token = USDT[chainId]
      if (!token) return setLog(`No EVM USDT configured for chain ${chainId}.`)
      const bal = await readErc20Balance(token, address)
      setLog(`EVM USDT on chain ${chainId}: ${bal.formatted} ${bal.symbol}`)
    } catch (e) {
      setLog(String(e?.message || e))
    }
  }

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="nav">
        <div className="brand">
          <img className="brand-icon" src="/favicon.svg" alt="" />
          <span className="brand-title">NeonVault</span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setShowConnect(true)}>
            {isConnected ? `${truncate(address)} • Wallet` : 'Connect Wallet'}
          </button>
          {isConnected && (
            <button className="btn btn-outline" onClick={openNetworkModal}>
              Networks
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <h1>Gate premium features behind your wallet.</h1>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowConnect(true)}>
              {isConnected ? 'View Wallets' : 'Connect to Continue'}
            </button>
            {isConnected && (
              <button className="btn btn-secondary" onClick={onReadUSDT_EVM}>
                Read USDT (EVM)
              </button>
            )}
          </div>

          {/* KPI Section */}
          <div className="kpis">
            <div className="kpi"><h3>Status</h3><p>{status}</p></div>
            <div className="kpi"><h3>Access</h3><p>{isConnected ? 'Granted' : 'Locked'}</p></div>
            <div className="kpi"><h3>Address</h3><p>{isConnected ? truncate(address) : '—'}</p></div>
            <div className="kpi"><h3>Chain</h3><p>{chainId || '—'}</p></div>
          </div>
        </div>
      </section>

      {/* BALANCE LIST */}
      {isConnected && (
        <section className="mt-4">
          <h3>Detected Balances</h3>
          {loadingBalances ? (
            <p>⏳ Fetching balances...</p>
          ) : balances.length > 0 ? (
            <ul className="list-disc ml-4 text-sm">
              {balances.map((b, i) => (
                <li key={i}>
                  <strong>{b.chain.toUpperCase()}</strong>: {Number(b.balance).toFixed(6)} {b.token}
                </li>
              ))}
            </ul>
          ) : (
            <p>No balances found.</p>
          )}
        </section>
      )}

      {/* LOG OUTPUT */}
      {log && (
        <section className="mt-4">
          <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">{log}</pre>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        NeonVault • Built with AppKit + Wagmi • {new Date().getFullYear()}
      </footer>

      {/* CONNECT MODAL */}
      <ConnectModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onOpenAppKit={() => {
          setShowConnect(false)
          openConnectModal()
        }}
      />
    </div>
  )
}
