import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";

const deployerAccounts = process.env.BLOCKCHAIN_PRIVATE_KEY
  ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
  : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    ganache: {
      url: process.env.BLOCKCHAIN_RPC_URL ?? "http://127.0.0.1:7545",
      chainId: Number(process.env.BLOCKCHAIN_CHAIN_ID ?? 1337),
      ...(deployerAccounts.length ? { accounts: deployerAccounts } : {}),
    },
  },
};

export default config;
