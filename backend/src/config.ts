export const config = {
  port: parseInt(process.env.API_PORT || process.env.PORT || "3001"),
  privateKey: process.env.PRIVATE_KEY || "",
  walletAddress: process.env.WALLET_ADDRESS || "",
  rpcUrl: process.env.RPC_URL || "",
  usdcAddress: process.env.USDC_ADDRESS || "",
  contractAddress: process.env.CONTRACT_ADDRESS || "",
  networkName: process.env.NETWORK_NAME || "base-sepolia",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
