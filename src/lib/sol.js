// src/lib/sol.js
// Auto-detects all Solana balances (SOL + SPL tokens) using Alchemy + Moralis

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY ;
const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY ;
const SOLANA_RPC = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;

async function rpcCall(url, method, params = []) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  } catch (err) {
    console.error(`❌ RPC call failed (${method}):`, err.message);
    return null;
  }
}

async function getFromAlchemy(address) {
  console.log("🧠 Using Alchemy to fetch Solana balances...");
  const balances = { native: 0, tokens: [] };

  // 1️⃣ Native SOL
  const native = await rpcCall(SOLANA_RPC, "getBalance", [address]);
  if (native) balances.native = native / 1e9;

  // 2️⃣ SPL Tokens
  const tokenAccounts = await rpcCall(SOLANA_RPC, "getTokenAccountsByOwner", [
    address,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);

  if (tokenAccounts?.value?.length) {
    balances.tokens = tokenAccounts.value.map((acc) => {
      const info = acc.account.data.parsed.info;
      const decimals = info.tokenAmount.decimals || 0;
      const balance = info.tokenAmount.uiAmount || 0;
      const mint = info.mint;
      return { mint, balance, decimals };
    });
  }

  return balances;
}

async function getFromMoralis(address) {
  console.log("🧠 Using Moralis as fallback...");
  const url = `https://solana-gateway.moralis.io/account/mainnet/${address}/tokens`;
  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": MORALIS_KEY },
    });
    const data = await res.json();
    if (!data) throw new Error("Empty Moralis response");
    const native = data.nativeBalance ? data.nativeBalance / 1e9 : 0;
    const tokens = data.tokens?.map((t) => ({
      mint: t.mint,
      balance: t.amount / 10 ** t.decimals,
      decimals: t.decimals,
      symbol: t.symbol,
      name: t.name,
    })) || [];
    return { native, tokens };
  } catch (err) {
    console.error("❌ Moralis fetch failed:", err.message);
    return { native: 0, tokens: [] };
  }
}

export async function getSolanaBalances(address) {
  if (!address) {
    console.warn("⚠️ getSolanaBalances: No address provided");
    return;
  }

  console.log("🔍 Fetching Solana balances for:", address);

  let balances = await getFromAlchemy(address);

  // fallback if empty or failed
  if ((!balances.native && balances.tokens.length === 0) && MORALIS_KEY) {
    balances = await getFromMoralis(address);
  }

  console.log(`💰 SOL: ${balances.native}`);
  console.log(`🪙 Tokens detected: ${balances.tokens.length}`);
  console.log("📦 Tokens detail:", balances.tokens);

  const totalTokens = balances.tokens.length + (balances.native > 0 ? 1 : 0);
  console.log(`✅ Done. Total Solana assets: ${totalTokens}`);

  return balances;
}
