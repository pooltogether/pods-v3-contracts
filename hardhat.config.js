require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-log-remover");
require("hardhat-deploy");
require("solidity-coverage");
const networks = require("./hardhat.networks");

// Tasks
require("./hardhat/hardhat.development");
require("./hardhat/hardhat.uniswap");

// Hardhat Configuration
module.exports = {
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    sponsor: {
      default: 1,
    },
    user: {
      default: 1,
    },
  },
  networks,
  mocha: {
    timeout: 30000,
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
      },
      {
        version: "0.6.10",
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.7.0",
      },
      {
        version: "0.8.0",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
