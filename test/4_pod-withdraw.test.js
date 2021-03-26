const hardhat = require("hardhat");
const { ethers } = require("hardhat");
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

describe("Pod - Withdraw", function() {
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
      ethers.utils.parseEther("500"),
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

  it("should fail when account is withdrawing with 0 shares", async function() {
    await expect(
      testing.pod.withdraw(utils.parseEther("0"))
    ).to.be.revertedWith("SafeMath: division by zero");
  });

  it("should fail when account is withdrawing with excessive shares", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(testing.alice.address, utils.parseEther("999"));

    await expect(
      testing.pod.withdraw(utils.parseEther("1000"))
    ).to.be.revertedWith("Pod:insufficient-shares");
  });

  it("should succeed when withdrawing valid amount before batch()", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );

    // balanceOf()
    const balanceOf = await testing.pod.balanceOf(testing.owner.address);

    expect(balanceOf).to.equal(toWei("1000"));

    const withdraw = await testing.pod.withdraw(utils.parseEther("1000"));

    // getTransactionReceipt(depositTo.hash)
    let receipt = await provider.getTransactionReceipt(withdraw.hash);

    // Check All Events
    expect(testing.pod.interface.parseLog(receipt.logs[0]).name).to.equal(
      "DripCalculate"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[1]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[2]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[3]).name).to.equal(
      "Withdrawl"
    );
  });

  it("should succeed when withdrawing valid amount after batch()", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );

    // batch()
    const batch = await testing.pod.batch(utils.parseEther("1000"));

    // getTransactionReceipt(batch.hash)
    let receiptBatch = await provider.getTransactionReceipt(batch.hash);

    // Check Pod Specific Events
    // expect(testing.pod.interface.parseLog(receiptBatch.logs[6]).name).to.equal(
    //   "PodClaimed"
    // );
    // expect(testing.pod.interface.parseLog(receiptBatch.logs[18]).name).to.equal(
    //   "Batch"
    // );

    // balanceOf()
    const balanceOf = await testing.pod.balanceOf(testing.owner.address);

    expect(balanceOf).to.equal(toWei("1000"));

    const withdraw = await testing.pod.withdraw(utils.parseEther("1000"));

    // getTransactionReceipt(depositTo.hash)
    let receipt = await provider.getTransactionReceipt(withdraw.hash);

    // Check All Events
    expect(testing.pod.interface.parseLog(receipt.logs[0]).name).to.equal(
      "DripCalculate"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[1]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[2]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[3]).name).to.equal(
      "Withdrawl"
    );
  });
});
