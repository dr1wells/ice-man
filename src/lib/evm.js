// src/lib/evm.js
import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

if (!ALCHEMY_KEY) {
  console.warn("⚠️ Missing VITE_ALCHEMY_API_KEY in your .env file");
}

/**
 * ✅ Alchemy networks — for all chains your key supports
 */
const alchemyConfigs = {
  ethereum: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.ETH_MAINNET }),
  polygon: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.MATIC_MAINNET }),
  arbitrum: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.ARB_MAINNET }),
  optimism: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.OPT_MAINNET }),
  base: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.BASE_MAINNET }),
  avalanche: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.AVAX_MAINNET }),
};

/**
 * ✅ Public RPC fallback for non-Alchemy chains
 */
const rpcFallbacks = {
  bnb: "https://bsc-dataseed1.binance.org",
  fantom: "https://rpc.fantom.network",
  gnosis: "https://rpc.gnosischain.com",
  cronos: "https://evm.cronos.org",
};

/**
 * Utility to check Alchemy network errors
 */
function isAlchemyNetworkError(err) {
  const msg = String(err?.message || err);
  return msg.toLowerCase().includes("not enabled") || msg.toLowerCase().includes("403");
}

/**
 * ✅ Main function: fetch balances from multiple EVM networks
 */
export async function getEvmBalances(address) {
  if (!address) {
    console.warn("⚠️ getEvmBalances: address required");
    return [];
  }

  const results = [];

  // --- Alchemy-based chains ---
  await Promise.all(
    Object.entries(alchemyConfigs).map(async ([chain, alchemy]) => {
      try {
        const native = await alchemy.core.getBalance(address);
        results.push({
          chain,
          token: "NATIVE",
          balance: ethers.utils.formatEther(native),
        });

        // ERC-20 balances
        const tokenData = await alchemy.core.getTokenBalances(address);
        if (tokenData?.tokenBalances?.length) {
          for (const t of tokenData.tokenBalances) {
            if (!t.tokenBalance || t.tokenBalance === "0") continue;
            try {
              const meta = await alchemy.core.getTokenMetadata(t.contractAddress);
              const decimals = meta?.decimals || 18;
              results.push({
                chain,
                token: meta?.symbol || "UNKNOWN",
                name: meta?.name || "Unknown Token",
                balance: ethers.utils.formatUnits(t.tokenBalance, decimals),
                address: t.contractAddress,
              });
            } catch {
              // skip metadata errors
            }
          }
        }
      } catch (err) {
        if (isAlchemyNetworkError(err)) {
          console.warn(`${chain}: ⚠️ Network not enabled for this key`);
        } else {
          console.warn(`${chain}: ❌ Alchemy query failed:`, err.message || err);
        }
      }
    })
  );

  // --- RPC fallback chains ---
  await Promise.all(
    Object.entries(rpcFallbacks).map(async ([chain, rpcUrl]) => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const bal = await provider.getBalance(address);
        results.push({
          chain,
          token: "NATIVE",
          balance: ethers.utils.formatEther(bal),
        });
      } catch (err) {
        console.warn(`${chain}: ❌ RPC failed:`, err.message || err);
      }
    })
  );

  return results;
}
