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
};

/* --- Hardhat Node Configuration --- */
if (process.env.ALCHEMY_API_KEY && process.env.FORK_ENABLED_CHAINID) {
  networks.hardhat = {
    chainId: parseInt(process.env.FORK_ENABLED_CHAINID),
    hardfork: "istanbul",
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
    forking: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    },
  };

  // Set mainnet fork blocknumber
  if (process.env.FORK_BLOCK_NUMBER) {
    networks.hardhat.forking.blockNumber = parseInt(
      process.env.FORK_BLOCK_NUMBER
    );
  }
} else {
  networks.hardhat = {
    hardfork: "istanbul",
    allowUnlimitedContractSize: true,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };
}

/* --- Testnet(s) Configuration --- */
if (process.env.INFURA_API_KEY && process.env.MNEMONIC_TESTNET) {
  networks.kovan = {
    gasPrice: 10000000000,
    url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };

  networks.ropsten = {
    gasPrice: 10000000000,
    url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC_TESTNET,
    },
  };

  networks.rinkeby = {
    gasPrice: 10000000000,
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
    gasPrice: 52000000000,
    url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
  };
  if (process.env.MNEMONIC_MAINNET && process.env.MAINNET_DEPLOY) {
    networks.mainnet.accounts = {
      mnemonic: process.env.MNEMONIC_MAINNET,
    };
  }
} else {
  console.warn("No Alchemy endpoint available for Ethereum mainnet");
}

module.exports = networks;
