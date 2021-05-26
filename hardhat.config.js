// require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-log-remover");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-dependency-compiler");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");

// Setup Hardhat Tasks
require("./hardhat/hardhat.development");
require("./hardhat/hardhat.uniswap");

// Import Network Configuration
const networks = require("./hardhat.networks");

// Hardhat Configuration
module.exports = {
  defaultNetwork: "hardhat",
  networks,
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
    sponsor: {
      default: 1,
    },
    prizePoolDAI: {
      default: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a", // mainnet
      1: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a", // mainnet
      4: "0x4706856FA8Bb747D50b4EF8547FE51Ab5Edc4Ac2", // rinkeby
    },
    prizePoolDAITicket: {
      default: "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF", // mainnet
      4: "0x4fb19557fbd8d73ac884efbe291626fd5641c778", // rinkeby
    },
    prizePoolDAIFaucet: {
      default: "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb", // mainnet
      4: "0x5d5af77cf99f7015e615f9b3286a27c5b6090707", // rinkeby
    },
    prizePoolUSDC: {
      default: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416", // mainnet
      1: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416", // mainnet
      4: "0xde5275536231eCa2Dd506B9ccD73C028e16a9a32", // rinkeby
    },
    prizePoolUSDCTicket: {
      default: "0xd81b1a8b1ad00baa2d6609e0bae28a38713872f7", // mainnet
      4: "0xb03dc163f2becdd6fa3f44def57e28f1ba95f741", // rinkeby
    },
    prizePoolUSDCFaucet: {
      default: "0xbd537257fad96e977b9e545be583bbf7028f30b9", // mainnet
      4: "0xeabd4780f4e8508f7df5a736bc1ae2bd74523acb", // rinkeby
    },
    WETH: {
      default: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // mainnet
      1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // mainnet
    },
    DAI: {
      default: "0x6b175474e89094c44da98b954eedeac495271d0f", // mainnet
      1: "0x6b175474e89094c44da98b954eedeac495271d0f", // mainnet
    },
    USDC: {
      default: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // mainnet
      1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // mainnet
    },
    POOL: {
      default: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e", // mainnet
      1: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e", // mainnet
    },
    UniswapRouter: {
      default: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // mainnet
      1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // mainnet
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  dependencyCompiler: {
    paths: [
      "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-pool/PrizePool.sol",
      "@pooltogether/pooltogether-contracts/contracts/token-faucet/TokenFaucet.sol",
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
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
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
