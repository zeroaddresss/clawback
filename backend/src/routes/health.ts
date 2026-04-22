import { Hono } from "hono";
import { config } from "../config";
import { getWallet, getProvider, getUsdcContract } from "../services/blockchain";

const health = new Hono();

health.get("/health", async (c) => {
  let walletAddress = config.walletAddress || "0x0000000000000000000000000000000000000000";
  let ethBalance = "0.000000";
  let usdcBalance = "0.00";

  try {
    const wallet = getWallet();
    if (wallet) {
      walletAddress = wallet.address;
      const provider = getProvider();
      const rawBalance = await provider.getBalance(walletAddress);
      ethBalance = (Number(rawBalance) / 1e18).toFixed(6);
      const usdc = getUsdcContract();
      const rawUsdc = await usdc.balanceOf(walletAddress);
      usdcBalance = (Number(rawUsdc) / 1e6).toFixed(2);
    }
  } catch {
    // Wallet not initialized yet
  }

  return c.json({
    status: "ok",
    contract: config.contractAddress,
    network: config.networkName,
    wallet: walletAddress,
    ethBalance,
    usdcBalance,
    timestamp: new Date().toISOString(),
  });
});

export default health;
