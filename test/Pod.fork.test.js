require("./helpers/chaiMatchers");
const hardhat = require("hardhat");
const { expect } = require("chai");
const { utils } = require("ethers");

const { prizePoolDefault } = require("./helpers/constants");
const { purchaseToken } = require("../lib/uniswap");
const { toWei } = require("./utilities/bignumbers");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

const { ethers } = hardhat
const { constants } = ethers

describe("Pod - Fork", function () {
  let testing = {};
  let wallet, wallet2, wallet3, wallet4

  before(async () => {
    provider = hardhat.ethers.provider;
    [wallet, wallet2, wallet3, wallet4] = await ethers.getSigners()
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, prizePoolDefault);

    // Acquire DAI Token
    await purchaseToken(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      prizePoolDefault.token,
      ethers.utils.parseEther("50"),
      testing.owner.address,
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );
    
    await purchaseToken(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      prizePoolDefault.reward,
      ethers.utils.parseEther("50"),
      testing.owner.address,
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );
  });

  beforeEach(async () => {
    const [pod] = await createPodAndTokenDrop(testing, prizePoolDefault);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt(
      "TokenDrop",
      await testing.pod.tokenDrop()
    );
  });

  it("should fail when setting TokenDrop from unauthorized account", async function () {
    testing.pod = testing.pod.connect(wallet2);
    const setTokenDrop = testing.pod.setTokenDrop(testing.token.address);
    await expect(setTokenDrop).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });


  it("should fail when account is withdrawing with excessive shares", async function () {
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(testing.alice.address, utils.parseEther("999"));

    const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
      utils.parseEther("999")
    );

    await expect(
      testing.pod.withdraw(utils.parseEther("1000"), getEarlyExitFee)
    ).to.be.revertedWith("Pod:insufficient-shares");
  });

  it("should succeed when withdrawing valid amount before batch()", async function () {
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );
    const balanceOf = await testing.pod.balanceOf(testing.owner.address);
    expect(balanceOf).to.equal(toWei("1000"));

    const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
      utils.parseEther("1000")
    );

    const withdraw = await testing.pod.withdraw(
      utils.parseEther("1000"),
      getEarlyExitFee
    );

    let receipt = await provider.getTransactionReceipt(withdraw.hash);
    expect(testing.pod.interface.parseLog(receipt.logs[0]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[1]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[2]).name).to.equal(
      "Withdrawal"
    );
  });

  it("should succeed when withdrawing valid amount after batch()", async function () {
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );
    await testing.pod.batch();

    const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
      utils.parseEther("1000")
    );

    expect(
      await testing.pod.callStatic.getEarlyExitFee(utils.parseEther("1000"))
    ).to.equalish(utils.parseEther("10"), utils.parseEther("0.02"));

    await testing.pod.withdraw(
      utils.parseEther("1000"),
      getEarlyExitFee
    );
  });

  it("should run depositTo and drop with token drop unset", async function () {
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );
    
    await testing.pod.setTokenDrop(
      constants.AddressZero
    );

    await testing.pod.drop();
  });

  it("should run depositTo, drop and withdraw", async function () {
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );
    await testing.pod.drop();

    const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
      utils.parseEther("1000")
    );

    expect(
      await testing.pod.callStatic.getEarlyExitFee(utils.parseEther("1000"))
    ).to.equalish(utils.parseEther("10"), utils.parseEther("0.02"));

    await testing.pod.withdraw(
      utils.parseEther("1000"),
      getEarlyExitFee
    );
  });

  it("should run depositTo, drop with available reward tokens and withdraw", async function () {
    // Add POOL to Pod
    await testing.pool.transfer(
      testing.pod.address,
      utils.parseEther("100")
    );

    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );
    
    await testing.pod.drop();

    const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
      utils.parseEther("1000")
    );

    expect(
      await testing.pod.callStatic.getEarlyExitFee(utils.parseEther("1000"))
    ).to.equalish(utils.parseEther("10"), utils.parseEther("0.02"));

    await testing.pod.withdraw(
      utils.parseEther("1000"),
      getEarlyExitFee
    );
  });
});
