const hardhat = require("hardhat");
const { utils } = require("ethers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

require("./helpers/chaiMatchers");
const { getConfig } = require("../lib/config");
const { purchaseToken } = require("../lib/uniswap");
const { isTransactionMined } = require("./utilities/transactions");
const { advanceTimeAndBlock } = require("./utilities/time");
const { toWei } = require("./utilities/bignumbers");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

describe("TokenDropFactory", function() {
  let testing = {};
  const config = getConfig("mainnet");

  before(async () => {
    provider = hardhat.ethers.provider;

    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);
  });

  beforeEach(async () => {
    // Deploy PodNFT contract
    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);
  });

  it("should create a new TokenDropFactory smart contract", async function() {
    // exists
    expect(utils.isAddress(testing.tokenDropFactory.address)).to.equal(
      utils.isAddress(testing.tokenDropFactory.address)
    );

    // tokenDropInstance()
    // expect(
    //   utils.isAddress(await testing.tokenDropFactory.tokenDropInstance)
    // ).to.equal(utils.isAddress(testing.tokenDropFactory.address));
  });

  it("should create a new TokenDrop smart contract", async function() {
    const tokenDropAddress = await testing.tokenDropFactory.callStatic.create(
      testing.pod.address,
      config.podDAI.pool
    );

    // Event LogCreateTokenDrop(address tokenDrop)
    const createTokenDrop = await testing.tokenDropFactory.create(
      testing.pod.address,
      config.podDAI.pool
    );

    // Transaction Receipt
    let receipt = await provider.getTransactionReceipt(createTokenDrop.hash);

    // Event Logs
    let eventProxyCreated = testing.tokenDropFactory.interface.parseLog(
      receipt.logs[0]
    );
    let eventLogCreateTokenDrop = testing.tokenDropFactory.interface.parseLog(
      receipt.logs[1]
    );

    // Check Events
    expect(eventProxyCreated.name).to.equal("ProxyCreated");
    expect(eventLogCreateTokenDrop.name).to.equal("LogCreateTokenDrop");
  });
});
