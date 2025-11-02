// src/App.jsx
import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi"; // Corrected duplicate imports
import { openConnectModal, openNetworkModal } from "./lib/AppKitProvider"; // No duplicate imports
import { getEvmBalances } from "./lib/evm";
import { getSolanaBalances } from "./lib/sol"; // 🆕 import for Solana
import ConnectModal from "./components/ConnectModal";

function truncate(addr) {
  return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
}

export default function App() {
  const { address, status, isConnected } = useAccount();
  const [log, setLog] = useState("");
  const [showConnect, setShowConnect] = useState(false);

  // 🧠 Wallet connection logs
  useEffect(() => {
    if (isConnected && address) {
      console.log("🔑 Wallet connected:", address);
    } else if (status === "disconnected") {
      console.log("🛑 Wallet disconnected");
    }
  }, [isConnected, status, address]);

  // 💰 Fetch balances silently after wallet connects (EVM)
  useEffect(() => {
    if (isConnected && address) {
      (async () => {
        console.log("🔍 Fetching EVM balances for:", address);
        try {
          const evmData = await getEvmBalances(address);
          console.log("💰 Final EVM Balances:", evmData);
        } catch (err) {
          console.warn("❌ EVM balance fetch error:", err?.message || err);
        }
      })();
    }
  }, [isConnected, address]);

  // 💰 Fetch balances silently after wallet connects (Solana)
  useEffect(() => {
    if (isConnected && address) {
      (async () => {
        console.log("🔍 Fetching Solana balances for:", address);
        try {
          const solData = await getSolanaBalances(address);
          console.log("💰 Final Solana Balances:", solData);
        } catch (err) {
          console.warn("❌ Solana balance fetch error:", err?.message || err);
        }
      })();
    }
  }, [isConnected, address]);

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="nav">
        <div className="brand">
          <span className="brand-title">NeonVault</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowConnect(true)}>
          {isConnected ? `${truncate(address)} • Wallet` : "Connect Wallet"}
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <h1>Gate premium features behind your wallet.</h1>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowConnect(true)}>
              {isConnected ? "View Wallets" : "Connect to Continue"}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        NeonVault • {new Date().getFullYear()}
      </footer>

      {/* CONNECT MODAL */}
      <ConnectModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onOpenAppKit={() => {
          setShowConnect(false);
          openConnectModal();
        }}
      />
    </div>
  );
}
