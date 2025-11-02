// src/lib/evm.js
import { ethers } from "ethers";

/**
 * Config
 */
const ALCHEMY_KEY =
  import.meta.env.VITE_ALCHEMY_API_KEY ;
const MORALIS_KEY =
  import.meta.env.VITE_MORALIS_API_KEY ;

const DEFAULT_TIMEOUT_MS = 8000;
const RETRIES = 2;

/**
 * RPC endpoints
 */
const CHAINS = {
  ethereum: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
  base: "https://mainnet.base.org",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  bnb: [
    "https://bsc-dataseed.binance.org/",
    "https://bsc.rpc.blxrbdn.com",
    "https://bscrpc.com",
  ],
  fantom: "https://rpc.fantom.network",
  gnosis: "https://rpc.gnosischain.com",
  cronos: "https://evm.cronos.org",
};

/**
 * Chain mapping → Moralis API chain names
 */
const MORALIS_CHAINS = {
  ethereum: "eth",
  polygon: "polygon",
  bnb: "bsc",
  avalanche: "avalanche",
  arbitrum: "arbitrum",
  optimism: "optimism",
  fantom: "fantom",
  base: "base",
  gnosis: "gnosis",
  cronos: "cronos",
};

/**
 * Helpers
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, label = "") =>
  Promise.race([
    p,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`Timeout ${label}`)), ms)
    ),
  ]);
async function retry(fn, times = RETRIES) {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === times - 1) throw e;
      await sleep(500 * (i + 1));
    }
  }
}

/**
 * Native balances
 */
async function getNativeBalances(address) {
  const results = await Promise.allSettled(
    Object.entries(CHAINS).map(async ([chain, rpc]) => {
      const urls = Array.isArray(rpc) ? rpc : [rpc];
      for (const url of urls) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(url);
          const balance = await retry(() =>
            withTimeout(provider.getBalance(address), DEFAULT_TIMEOUT_MS, chain)
          );
          const formatted = ethers.utils.formatEther(balance);
          return { chain, token: "NATIVE", balance: formatted };
        } catch (e) {}
      }
      return null;
    })
  );

  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean);
}

/**
 * ERC20 balances via Moralis API
 */
async function getTokenBalances(address) {
  const results = await Promise.allSettled(
    Object.entries(MORALIS_CHAINS).map(async ([chain, moralisChain]) => {
      try {
        const res = await fetch(
          `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${moralisChain}`,
          {
            headers: { "X-API-Key": MORALIS_KEY },
          }
        );

        if (!res.ok) throw new Error(`Moralis ${chain}: ${res.status}`);
        const data = await res.json();

        const tokens = data
          .filter((t) => Number(t.balance) > 0)
          .map((t) => ({
            chain,
            token: t.symbol || "Unknown",
            balance: ethers.utils.formatUnits(
              t.balance,
              t.decimals || 18
            ),
            address: t.token_address,
          }));

        console.log(`🪙 ${chain}: ${tokens.length} tokens`);
        return tokens;
      } catch (err) {
        console.warn(`❌ Token fetch failed for ${chain}: ${err.message}`);
        return [];
      }
    })
  );

  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter(Boolean);
}

/**
 * Combined: Native + Tokens
 */
export async function getEvmBalances(address) {
  if (!address) return [];

  console.log("🔍 Fetching all balances for:", address);

  const [native, tokens] = await Promise.all([
    getNativeBalances(address),
    getTokenBalances(address),
  ]);

  const final = [...native, ...tokens];
  console.log(`✅ Done. Total balances: ${final.length}`);
  console.log(final);
  return final;
}
