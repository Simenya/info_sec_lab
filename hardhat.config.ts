import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatEthersPlugin, hardhatToolboxMochaEthersPlugin],
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          evmVersion: "paris",
        },
      },
    ],
  },
  networks: {
    ganache: {
      type: "http",
      chainType: "l1",
      url: process.env.GANACHE_RPC_URL ?? "http://127.0.0.1:7545",
      accounts: process.env.GANACHE_PRIVATE_KEY ? [process.env.GANACHE_PRIVATE_KEY] : [],
      chainId: 1337,
    },
  },
});