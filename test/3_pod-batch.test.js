const hardhat = require("hardhat");
const { ethers, waffle } = require("hardhat");
const { expect, assert } = require("chai");
const { constants, utils } = require("ethers");

require("./helpers/chaiMatchers");
const { getConfig } = require("../lib/config");
const { purchaseToken } = require("../lib/uniswap");
const { advanceTimeAndBlock } = require("./utilities/time");
const { toWei } = require("./utilities/bignumbers");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

describe("Pod - Batch", function() {
  const config = getConfig("mainnet");
  let testing = {};

  before(async () => {
    provider = hardhat.ethers.provider;
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);

    // Acquire PrizePool Token
    await purchaseToken(
      config.tokens.WETH,
      config.podDAI.token,
      ethers.utils.parseEther("50"),
      testing.owner.address,
      {
        UniswapRouter: config.contracts.UniswapRouter,
        exactAmount: true,
      }
    );
  });

  beforeEach(async () => {
    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);
  });

  it("should fail when pod float is 0", async function() {
    await expect(
      testing.pod.batch(utils.parseEther("1000"))
    ).to.be.revertedWith("Pod:zero-float-balance");
  });

  it("should fail when pod batchAmount is above vaultTokenBalance", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(testing.alice.address, utils.parseEther("999"));

    await expect(
      testing.pod.batch(utils.parseEther("1000"))
    ).to.be.revertedWith("Pod:insufficient-float-balance");
  });

  it("should fail when pod batchAmount is above vaultTokenBalance", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(testing.alice.address, utils.parseEther("999"));

    // batch()
    await expect(
      testing.pod.batch(utils.parseEther("1000"))
    ).to.be.revertedWith("Pod:insufficient-float-balance");
  });

  it("should succeed when batchAmount equals the vaultTokenBalance", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(
      testing.alice.address,
      utils.parseEther("1000")
    );

    // batch()
    const batch = await testing.pod.batch(utils.parseEther("1000"));

    // getTransactionReceipt(batch.hash)
    let receipt = await provider.getTransactionReceipt(batch.hash);

    // Check Pod Specific Events
    expect(testing.pod.interface.parseLog(receipt.logs[6]).name).to.equal(
      "PodClaimed"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[18]).name).to.equal(
      "Batch"
    );
  });
});
