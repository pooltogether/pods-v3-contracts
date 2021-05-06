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
  development: {
    url: `http://localhost:8543`,
    gasPrice: 150000000000,
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
    contracts: {},
  },
  hardhat: {
    chainId: 1337,
    allowUnlimitedContractSize: true,
    hardfork: "istanbul",
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
    forking: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      blockNumber: 11905343,
    },
  },

  rinkeby: {
    url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
    podDAI: {
      prizePool: "0x84ed0f89c033fe7dadfc4d5f2a516ebd9dc15644",
      token: "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea",
      ticket: "0xaa826545db0e04da9bb5542692eb31b439ba7175",
      faucet: "0x699995E4b039713b3824d039CcdFCa154D9aBD4c",
    },
    podUSDC: {
      prizePool: "0xde5275536231eCa2Dd506B9ccD73C028e16a9a32",
      token: "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b",
      ticket: "0xb03DC163f2BECDd6Fa3f44deF57e28F1Ba95F741",
      faucet: "0xeAbd4780f4e8508F7df5A736Bc1AE2bD74523acB",
    },
    podBAT: {
      prizePool: "0xab068F220E10eEd899b54F1113dE7E354c9A8eB7",
      token: "0xbf7a7169562078c96f0ec1a8afd6ae50f12e5a99",
      ticket: "0xd5eE7cD7A97ccBbf2B1Fb2c92C19515a41720eA5",
      faucet: "0x97B99693613aaA74A3fa0B2f05378b8F6A74a893",
    },
    podUSDT: {
      prizePool: "0xDCB24C5C96D3D0677add5B688DCD144601410244",
      token: "0xd9ba894e0097f8cc2bbc9d24d308b98e36dc6d02",
      ticket: "0xeC9c462378Ce6a5f387AB81cd775226a9fd960e9",
      faucet: "",
    },
  },

  // MAINNET CONFIGURATION
  mainnet: {
    url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
    gasPrice: 1000000000,
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },

    deployed: {},
    owner: "0xC14438f1E3afF20a8e9b41a60F29a3ADFEf16B10",
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
  },
};

module.exports = networks;
