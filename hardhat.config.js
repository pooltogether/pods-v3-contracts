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
      4: "0x84ed0f89c033fe7dadfc4d5f2a516ebd9dc15644", // rinkeby
    },
    prizePoolDAITicket: {
      default: "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF", // mainnet
      4: "", // rinkeby
    },
    prizePoolDAIFaucet: {
      default: "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb", // mainnet
      4: "", // rinkeby
    },
    prizePoolUSDC: {
      default: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416", // mainnet
      1: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416", // mainnet
      4: "0xde5275536231eCa2Dd506B9ccD73C028e16a9a32", // rinkeby
    },
    prizePoolUSDCTicket: {
      default: "0xd81b1a8b1ad00baa2d6609e0bae28a38713872f7", // mainnet
      4: "", // rinkeby
    },
    prizePoolUSDCFaucet: {
      default: "0xbd537257fad96e977b9e545be583bbf7028f30b9", // mainnet
      4: "", // rinkeby
    },
    prizePoolCOMP: {
      default: "0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7", // mainnet
      1: "0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7", // mainnet
      4: "", // rinkeby
    },
    prizePoolCOMPTicket: {
      default: "0x27b85f596feb14e4b5faa9671720a556a7608c69", // mainnet
      4: "", // rinkeby
    },
    prizePoolCOMPFaucet: {
      default: "0x72F06a78bbAac0489067A1973B0Cef61841D58BC", // mainnet
      4: "", // rinkeby
    },
    prizePoolUNI: {
      default: "0x0650d780292142835F6ac58dd8E2a336e87b4393", // mainnet
      1: "0x0650d780292142835F6ac58dd8E2a336e87b4393", // mainnet
      4: "", // rinkeby
    },
    prizePoolUNITicket: {
      default: "0xA92a861FC11b99b24296aF880011B47F9cAFb5ab", // mainnet
      4: "", // rinkeby
    },
    prizePoolUNIFaucet: {
      default: "0xa5dddefD30e234Be2Ac6FC1a0364cFD337aa0f61", // mainnet
      4: "", // rinkeby
    },
    prizePoolPOOL: {
      default: "0x396b4489da692788e327E2e4b2B0459A5Ef26791", // mainnet
      1: "0x396b4489da692788e327E2e4b2B0459A5Ef26791", // mainnet
      4: "", // rinkeby
    },
    prizePoolPOOLTicket: {
      default: "0x27D22A7648e955E510a40bDb058333E9190d12D4", // mainnet
      4: "", // rinkeby
    },
    prizePoolPOOLFaucet: {
      default: "0x30430419b86e9512E6D93Fc2b0791d98DBeb637b", // mainnet
      4: "", // rinkeby
    },
    prizePoolBAT: {
      1: "", // mainnet
      4: "0xab068F220E10eEd899b54F1113dE7E354c9A8eB7", // rinkeby
    },
    reserveRegistry: {
      default: "0x3e8b9901dBFE766d3FE44B36c180A1bca2B9A295", // mainnet
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
    COMP: {
      default: "0xc00e94cb662c3520282e6f5717214004a7f26888", // mainnet
      1: "0xc00e94cb662c3520282e6f5717214004a7f26888", // mainnet
    },
    UNI: {
      default: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // mainnet
      1: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // mainnet
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
