const networks = {
  coverage: {
    url: "http://127.0.0.1:8555",
    blockGasLimit: 200000000,
    allowUnlimitedContractSize: true,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    blockGasLimit: 200000000,
    allowUnlimitedContractSize: true,
  },

  hardhat: {
    chainId: 1337,
    allowUnlimitedContractSize: true,
    hardfork: "istanbul",
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
    forking: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      blockNumber: 11905343,
    },
  },
};

// networks.hardhat = {
//   chainId: 1,
//   accounts: {
//     mnemonic: process.env.HDWALLET_MNEMONIC,
//   },
//   forking: {
//     url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
//   },
// };

// if (process.env.ALCHEMY_API_KEY && process.env.FORK_ENABLED) {
// } else {
//   networks.hardhat = {
//     allowUnlimitedContractSize: true,
//   };
// }

/* --- Hardhat Node Configuration --- */

/* --- Testnet(s) Configuration --- */
if (process.env.INFURA_API_KEY && process.env.MNEMONIC_TESTNET) {
  networks.kovan = {
    url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };

  networks.ropsten = {
    url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };

  networks.rinkeby = {
    url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };
} else {
  console.warn("No Infura and/or HDwallet available for Ethereum testnets");
}

/* --- Mainnet Configuration --- */
if (process.env.ALCHEMY_API_KEY) {
  networks.mainnet = {
    url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    podDAI: {
      prizePool: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a",
      token: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      ticket: "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF",
      faucet: "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb",
    },
    podUSDC: {
      prizePool: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416",
      token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ticket: "0xd81b1a8b1ad00baa2d6609e0bae28a38713872f7",
      faucet: "0xbd537257fad96e977b9e545be583bbf7028f30b9",
    },
    podUNI: {
      prizePool: "0x0650d780292142835F6ac58dd8E2a336e87b4393",
      token: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      ticket: "0xA92a861FC11b99b24296aF880011B47F9cAFb5ab",
      faucet: "0xa5dddefD30e234Be2Ac6FC1a0364cFD337aa0f61",
    },
    podCOMP: {
      prizePool: "0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7",
      token: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      ticket: "0x27b85f596feb14e4b5faa9671720a556a7608c69",
      faucet: "0x72F06a78bbAac0489067A1973B0Cef61841D58BC",
    },
    contracts: {
      UniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      UniswapFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      DaiPrizeprizePool: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a",
      UsdcPrizeprizePool: "0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416",
      CompPrizeprizePool: "0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7",
      UniPrizeprizePool: "0x0650d780292142835F6ac58dd8E2a336e87b4393",
    },
    tokens: {
      DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
      UNI: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      COMP: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      POOL: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e",
    },
  };
  if (process.env.MNEMONIC_MAINNET && process.env.MAINNET_DEPLOY) {
    networks.mainnet = {
      accounts: {
        mnemonic: process.env.MNEMONIC_MAINNET,
      },
    };
  }
} else {
  console.warn("No Alchemy endpoint available for Ethereum mainnet");
}

module.exports = networks;
