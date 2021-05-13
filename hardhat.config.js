require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-log-remover");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-dependency-compiler");
const networks = require("./hardhat.networks");

// Tasks
require("./hardhat/hardhat.development");
require("./hardhat/hardhat.uniswap");

// Hardhat Configuration
module.exports = {
  defaultNetwork: "localhost",
  networks,
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
    prizePoolDAI: {
      1: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a", // mainnet
      4: "0x84ed0f89c033fe7dadfc4d5f2a516ebd9dc15644", // rinkeby
    },
    prizePoolUSDC: {
      1: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416", // mainnet
      4: "0xde5275536231eCa2Dd506B9ccD73C028e16a9a32", // rinkeby
    },
    prizePoolCOMP: {
      1: "0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7", // mainnet
      4: "", // rinkeby
    },
    prizePoolUNI: {
      1: "0x0650d780292142835F6ac58dd8E2a336e87b4393", // mainnet
      4: "", // rinkeby
    },
    prizePoolPOOL: {
      1: "", // mainnet
      4: "", // rinkeby
    },
    prizePoolBAT: {
      1: "", // mainnet
      4: "0xab068F220E10eEd899b54F1113dE7E354c9A8eB7", // rinkeby
    },
    reserveRegistry: {
      1: "0x3e8b9901dBFE766d3FE44B36c180A1bca2B9A295", // mainnet
      4: "0xaDae16a9A1B648Cdc753558Dc19780Ea824a3904", // rinkeby
      42: "0xdcC0D09beE9726E23256ebC059B7487Cd78F65a0", // kovan
      100: "0x20F29CCaE4c9886964033042c6b79c2C4C816308", // xdai
      77: "0x4d1639e4b237BCab6F908A1CEb0995716D5ebE36", // poaSokol
      137: "0x20F29CCaE4c9886964033042c6b79c2C4C816308", //matic
      80001: "0xdcC0D09beE9726E23256ebC059B7487Cd78F65a0", // mumbai
      56: "0x3e8b9901dBFE766d3FE44B36c180A1bca2B9A295", // bsc
      97: "0x3e8b9901dBFE766d3FE44B36c180A1bca2B9A295", //bscTestnet
    },
  },
  external: {
    contracts: [
      {
        artifacts:
          "node_modules/@pooltogether/pooltogether-contracts/artifacts",
      },
    ],
  },
  mocha: {
    timeout: 30000,
  },
  dependencyCompiler: {
    paths: [
      "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-pool/PrizePool.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-strategy/multiple-winners/MultipleWinners.sol",
    ],
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
