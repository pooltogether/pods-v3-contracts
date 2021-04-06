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

describe("Pod - Deposit", function() {
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

  it("should fail when depositing 0", async function() {
    await expect(
      testing.pod.depositTo(testing.owner.address, utils.parseEther("0"))
    ).to.be.revertedWith("Pod:invalid-amount");
  });

  it("should succeed when depositing above 0", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    const depositTo = await testing.pod.depositTo(
      testing.alice.address,
      utils.parseEther("1000")
    );

    // getTransactionReceipt(depositTo.hash)
    let receipt = await provider.getTransactionReceipt(depositTo.hash);

    // Check All Events
    expect(testing.pod.interface.parseLog(receipt.logs[0]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[1]).name).to.equal(
      "DripCalculate"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[2]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[3]).name).to.equal(
      "Deposited"
    );
  });

  it("should succeed when depositing twice and have equal deposits and shares", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("2000"));

    // depositTo()
    const depositTo = await testing.pod.depositTo(
      testing.alice.address,
      utils.parseEther("1000")
    );

    // getTransactionReceipt(depositTo.hash)
    let receipt = await provider.getTransactionReceipt(depositTo.hash);

    // Check All Events
    expect(testing.pod.interface.parseLog(receipt.logs[0]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[1]).name).to.equal(
      "DripCalculate"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[2]).name).to.equal(
      "Transfer"
    );
    expect(testing.pod.interface.parseLog(receipt.logs[3]).name).to.equal(
      "Deposited"
    );

    // Second depositTo()

    // depositTo()
    const depositToSecond = testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );

    // Event LogLiquidatedERC721
    await expect(depositToSecond)
      .to.emit(testing.pod, "Deposited")
      .withArgs(
        testing.owner.address,
        utils.parseEther("1000"),
        utils.parseEther("1000")
      );

    // depositTo()
    const totalSupply = await testing.pod.totalSupply();

    expect(totalSupply).equal(utils.parseEther("2000"));
  });

  describe("Single User [ @skip-on-coverage ]", function() {
    /******************|
      | Before Each
    /******************/
    beforeEach(async () => {
      // ZERO out Alice's token balance
      testing.token = testing.token.connect(testing.alice);
      await testing.token.transfer(
        constants.AddressZero,
        await testing.token.balanceOf(testing.alice.address)
      );

      testing.token = testing.token.connect(testing.owner);
      await testing.token.transfer(testing.alice.address, toWei("2000"));
    });

    it("should deposit token, run batch and burn all shares for total Pod balance [ @skip-on-coverage ]", async function() {
      testing.pod = testing.pod.connect(testing.alice);
      testing.token = testing.token.connect(testing.alice);

      // Check Balance
      const balance = await testing.token.balanceOf(testing.alice.address);

      // approve()
      await testing.token.approve(testing.pod.address, balance);

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // depositTo()
      await testing.pod.depositTo(
        testing.alice.address,
        utils.parseEther("2000")
      );

      // getPricePerShare()
      const getPricePerShare = await testing.pod.getPricePerShare();
      expect(getPricePerShare).equal(utils.parseEther("1"));
      assert.equal(getPricePerShare.toString(), utils.parseEther("1"));

      // getUserPricePerShare() with deposited balance
      const getUserPricePerShare = await testing.pod.getUserPricePerShare(
        testing.owner.address
      );

      expect(getUserPricePerShare).equal(utils.parseEther("0"));

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // batch()
      await testing.pod.batch(
        await testing.token.balanceOf(testing.pod.address)
      );

      // -----------------
      // Check Pod State
      // -----------------
      const podTickets = await testing.pod.vaultTicketBalance();
      const totalSupply = await testing.pod.totalSupply();

      // Pod Ticket == Total Supply
      expect(podTickets).to.equal(totalSupply);

        
      // pod.balanceOf(owner)
      const ownerBalancePreWithdraw = await testing.pod.balanceOf(
        testing.alice.address,
      );

      expect(ownerBalancePreWithdraw).to.equal(utils.parseEther("2000"));

      // -----------------
      // Withdraw Tokens
      // -----------------
      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      const getEarlyExitFee = await testing.pod.callStatic.getEarlyExitFee(
        utils.parseEther("2000")
      );

      // pod.withdraw(2000 ppToken) - convert shares to token
      await testing.pod.withdraw(utils.parseEther("2000"), getEarlyExitFee);

      expect(await testing.pod.balanceOf(testing.alice.address)).to.equal(
        toWei("0")
      );
      expect(await testing.token.balanceOf(testing.alice.address)).to.equalish(
        toWei("1980"),
        toWei("3")
      );
    });
  });

  describe("Multiple Users [ @skip-on-coverage ]", function() {
    beforeEach(async () => {
      // ZERO out Alice's token balance
      testing.token = testing.token.connect(testing.alice);
      await testing.token.transfer(
        constants.AddressZero,
        await testing.token.balanceOf(testing.alice.address)
      );

      // ZERO out Bob's token balance
      testing.token = testing.token.connect(testing.bob);
      await testing.token.transfer(
        constants.AddressZero,
        await testing.token.balanceOf(testing.bob.address)
      );

      // Reset Token connect to Owner
      testing.token = testing.token.connect(testing.owner);
    });

    // Pod - Deposit Multiple Accounts | Batch
    // ----------------------------------------------------------------
    it("should deposit multiple accounts, run batch and burn all shares for total Pod balance", async function() {
      await advanceTimeAndBlock(1);

      // token.approve(pod, owner.balance)
      await testing.token.approve(
        testing.pod.address,
        await testing.token.balanceOf(testing.owner.address)
      );

      // ----------------------------------
      // depositTo for Multuple Accounts
      // ----------------------------------
      // pod.depositTo(owner, 2000 tokens)
      testing.pod = testing.pod.connect(testing.owner);

      // pod.depositTo(alice, 2000 tokens)
      await testing.pod.depositTo(
        testing.alice.address,
        utils.parseEther("1000")
      );

      // pod.depositTo(bob, 2000 tokens)
      await testing.pod.depositTo(testing.bob.address, utils.parseEther("500"));

      // ----------------------------------
      // Check Pod State
      // ----------------------------------
      const podTokens = await testing.pod.vaultTokenBalance();
      const podTickets = await testing.pod.vaultTicketBalance();
      const totalSupply = await testing.pod.totalSupply();

      // Pod Ticket == Total Supply
      expect(podTokens).to.equal(totalSupply);

      // Pod Ticket == Total Supply
      expect(podTickets).to.equal(utils.parseEther("0"));

      // Pod Ticket == Total Supply
      expect(totalSupply).to.equal(utils.parseEther("1500"));

      // pod.balanceOf(alice) == 1000
      expect(await testing.pod.balanceOf(testing.alice.address)).to.equal(
        utils.parseEther("1000")
      );

      // pod.balanceOf(bob) == 500
      expect(await testing.pod.balanceOf(testing.bob.address)).to.equal(
        utils.parseEther("500")
      );

      // ----------------------------------
      // Convert token float to tickets
      // ----------------------------------
      // pod.batch()
      await testing.pod.batch(
        await testing.token.balanceOf(testing.pod.address)
      );

      // ----------------------------------
      // Alice
      // ----------------------------------

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // pod.withdraw(2000 ppToken) - convert shares to token
      testing.pod = testing.pod.connect(testing.alice);

      const getEarlyExitFeeAlice = await testing.pod.callStatic.getEarlyExitFee(
        utils.parseEther("1000")
      );


      await testing.pod.withdraw(utils.parseEther("1000"), getEarlyExitFeeAlice);

      expect(await testing.token.balanceOf(testing.alice.address)).to.equalish(
        utils.parseEther("990"),
        utils.parseEther("2")
      );

      // expect shares after withdraw to equal 0
      expect(await testing.pod.balanceOf(testing.alice.address)).to.equal(
        utils.parseEther("0")
      );

      // ----------------------------------
      // Bob
      // ----------------------------------

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // pod.withdraw(500 ppToken) - convert shares to token
      testing.pod = testing.pod.connect(testing.bob);

      const getEarlyExitFeeBob = await testing.pod.callStatic.getEarlyExitFee(
        utils.parseEther("500")
      );

      await testing.pod.withdraw(utils.parseEther("500"), getEarlyExitFeeBob);

      expect(await testing.token.balanceOf(testing.bob.address)).to.equalish(
        utils.parseEther("495"),
        utils.parseEther("2")
      );

      // expect shares after withdraw to equal 0
      expect(await testing.pod.balanceOf(testing.bob.address)).to.equal(
        utils.parseEther("0")
      );
    });
  });
});
