const hardhat = require("hardhat");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { utils, BigNumber } = require("ethers");

require("./helpers/chaiMatchers");
const { getConfig } = require("../lib/config");
const { purchaseToken } = require("../lib/uniswap");
const { call } = require("./helpers/call");
const { deployMockContract } = require("./helpers/deployMockContract");
const { advanceTimeAndBlock } = require("./utilities/time");
const { toWei } = require("./utilities/bignumbers");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

// CORE_TESTS_RUN = false;
POOL_TESTS_RUN = true;

describe("Pod - Drops", function() {
  let testing = {};
  const config = getConfig("mainnet");

  before(async () => {
    provider = hardhat.ethers.provider;
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);

    // Acquire PrizePool Token
    await purchaseToken(
      config.tokens.WETH,
      config.podDAI.token,
      utils.parseEther("1000"),
      testing.owner.address,
      {
        UniswapRouter: config.contracts.UniswapRouter,
        exactAmount: true,
      }
    );

    const balance = await testing.token.balanceOf(testing.owner.address);
  });

  /******************|
  | Before Each
  /******************/
  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
            blockNumber: 11905343,
          },
        },
      ],
    });
    // Reset Time/Block
    await advanceTimeAndBlock(1);

    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);

    // Set TokenDrop contract
    testing.drop = await ethers.getContractAt(
      "TokenDrop",
      await testing.pod.drop()
    );

    // Acquire PrizePool Token
    await purchaseToken(
      config.tokens.WETH,
      config.podDAI.token,
      utils.parseEther("1000"),
      testing.owner.address,
      {
        UniswapRouter: config.contracts.UniswapRouter,
        exactAmount: true,
      }
    );
  });

  // POD TokenDrop Core Settings
  // ----------------------------------------------------------------
  it("should have correct asset and measure tokens", async function() {
    const measure = await testing.drop.measure();
    expect(measure).to.equal(testing.pod.address);

    const asset = await testing.drop.asset();
    expect(ethers.utils.getAddress(asset)).to.equal(
      ethers.utils.getAddress(testing.pool.address)
    );
  });

  // POD TokenDrop Core Settings
  // ----------------------------------------------------------------
  it("should have correct initial configuration", async function() {
    const totalUnclaimed = await testing.drop.totalUnclaimed();
    expect(totalUnclaimed.toString()).to.equal("0");

    const lastDripTimestamp = await testing.drop.lastDripTimestamp();
    expect(lastDripTimestamp.toString()).to.equal("0");

    const exchangeRateMantissa = await testing.drop.exchangeRateMantissa();
    expect(exchangeRateMantissa.toString()).to.equal("0");
  });

  // Pod should always have 0 POOL without batch() called
  // ----------------------------------------------------------------
  it("should handle multiple deposits", async function() {
    podPoolBalance = await testing.pool.balanceOf(testing.pod.address);

    // Check Balance
    const balance = await testing.token.balanceOf(testing.owner.address);

    // approve()
    await testing.token.approve(testing.pod.address, balance);

    // Reset Time/Block
    await advanceTimeAndBlock(1);

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("25000")
    );

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("25000")
    );

    // batch()
    await testing.pod.batch(testing.token.balanceOf(testing.pod.address));

    // claimPodPool() callStatic
    const claimPoolStaticPreBatch = await testing.pod.callStatic.claimPodPool();

    // Expect 0 POOL rewards
    expect(claimPoolStaticPreBatch.toString()).equal("0");

    // Advance 1 Month
    await advanceTimeAndBlock(2592000);

    // claimPodPool() - Claim POOL for Pod
    await testing.pod.claimPodPool();

    // Advance 1 Month
    await advanceTimeAndBlock(2592000);

    // User Claim POOL allocation
    const claimOwnerStatic = await testing.pod.callStatic.claim(
      testing.owner.address,
      testing.owner.address
    );

    // Check Call Value
    // expect(claimOwnerStatic).to.equal(utils.parseEther("95.0765835338074"));
    expect(claimOwnerStatic).to.not.be.null;
  });

  /******************|
  | Test Batch Deposits
  /******************/
  describe("Settings", function() {
    before(async () => {});

    /******************|
    | Before Each
    /******************/
    beforeEach(async () => {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
              blockNumber: 11905343,
            },
          },
        ],
      });

      // const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
      // testing.pod = await ethers.getContractAt("Pod", pod);
      // testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);

      // // Set TokenDrop contract
      // testing.drop = await ethers.getContractAt(
      //   "TokenDrop",
      //   await testing.pod.drop()
      // );
    });
  });

  /******************|
  | Test Batch Deposits
  /******************/
  describe("Claim POOL", function() {
    before(async () => {});

    /******************|
    | Before Each
    /******************/
    beforeEach(async () => {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
              blockNumber: 11905343,
            },
          },
        ],
      });
      const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
      testing.pod = await ethers.getContractAt("Pod", pod);
      testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);

      // Acquire POOL token
      await purchaseToken(
        config.tokens.WETH,
        config.podDAI.token,
        utils.parseEther("50"),
        testing.owner.address,
        {
          UniswapRouter: config.contracts.UniswapRouter,
          exactAmount: true,
        }
      );
    });

    // Pod should always have 0 POOL without batch() called
    // ----------------------------------------------------------------
    it("should have 0 Pod POOL rewards before batch(", async function() {
      podPoolBalance = await testing.pool.balanceOf(testing.pod.address);

      // Check Balance
      const balance = await testing.token.balanceOf(testing.owner.address);

      // approve()
      await testing.token.approve(testing.pod.address, balance);

      // Reset Time/Block
      await advanceTimeAndBlock(1);

      // depositTo()
      await testing.pod.depositTo(
        testing.owner.address,
        utils.parseEther("50000")
      );

      // Advance 1 Month
      await advanceTimeAndBlock(2592000);

      // claimPodPool() callStatic
      const claimPoolStaticPreBatch = await testing.pod.callStatic.claimPodPool();

      // Expect 0 POOL rewards
      expect(claimPoolStaticPreBatch.toString()).equal("0");
    });

    // Distribute POOL to single Account
    // ----------------------------------------------------------------
    it("Pod should accumulate POOL rewards and allow single user to withdraw total allocation", async function() {
      // token.approve(pod, balance)
      await testing.token.approve(
        testing.pod.address,
        await testing.token.balanceOf(testing.owner.address)
      );

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // depositTo()
      await testing.pod.depositTo(
        testing.owner.address,
        utils.parseEther("50000")
      );

      // Control Next Time/Block Increase
      await advanceTimeAndBlock(1);

      // batch()
      await testing.pod.batch(testing.token.balanceOf(testing.pod.address));

      // Advance 100 Seconds
      // ------------------------------
      await advanceTimeAndBlock(100);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(
        utils.parseEther("0.0037047559905"),
        utils.parseEther("0.001")
      );

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("44"), utils.parseEther("1"));

      // Mock Contract
      // ------------------------------
      const POD = await hre.artifacts.readArtifact("Pod");
      podMock = await deployMockContract(testing.owner, POD.abi, {});

      await podMock.mock.token.returns(config.podDAI.token);

      await podMock.mock.claim
        .withArgs(testing.owner.address, testing.owner.address)
        .returns(toWei("44"));

      expect(
        await call(
          podMock,
          "claim",
          testing.owner.address,
          testing.owner.address
        )
      ).to.equalish(utils.parseEther("44"), utils.parseEther("1"));

      // User Claim POOL allocation
      const claimOwnerStatic = await testing.pod.callStatic.claim(
        testing.owner.address,
        testing.owner.address
      );
      const claimOwner = await testing.pod.claim(
        testing.owner.address,
        testing.owner.address
      );

      // Transaction Receipt
      let receipt = await provider.getTransactionReceipt(claimOwner.hash);

      // Event Logs
      let eventClaimed = testing.pod.interface.parseLog(receipt.logs[2]);

      // Check Call Value
      // expect(claimOwnerStatic).to.equal(utils.parseEther("44.37281619790315"));
      expect(claimOwnerStatic).to.not.be.null;
      expect(eventClaimed.name).to.equal("Claimed");

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("44"),
        utils.parseEther("1")
      );

      userClaimPool = await testing.pool.balanceOf(testing.owner.address);

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      // claimPodPool 30Days below/above
      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("44"), utils.parseEther("1"));

      // User Claim POOL allocation
      await testing.pod.claim(testing.owner.address, testing.owner.address);

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("88"),
        utils.parseEther("1")
      );

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("44"), utils.parseEther("3"));

      // User Claim POOL allocation
      await testing.pod.claim(testing.owner.address, testing.owner.address);

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("133"),
        utils.parseEther("1")
      );

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      // claimPodPool 30Days below/above
      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("44"), utils.parseEther("1"));

      // User Claim POOL allocation
      await testing.pod.claim(testing.owner.address, testing.owner.address);

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("177"),
        utils.parseEther("1")
      );

      // Advance 2 Weeks - POOL Rewards start to taper off here...
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      // claimPodPool 30Days below/above
      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("22"), utils.parseEther("3"));

      // User Claim POOL allocation
      await testing.pod.claim(testing.owner.address, testing.owner.address);

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("199"),
        utils.parseEther("1")
      );

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      // claimPodPool 30Days below/above
      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("0"), utils.parseEther("1"));

      // User Claim POOL allocation
      await testing.pod.claim(testing.owner.address, testing.owner.address);

      expect(await testing.pool.balanceOf(testing.owner.address)).to.equalish(
        utils.parseEther("195"),
        utils.parseEther("100")
      );
    });

    // Distribute POOL to multiple Accounts
    // ----------------------------------------------------------------
    it("Pod should accumulate POOL rewards and multiple users to withdraw total allocation", async function() {
      // token.approve(pod, owner.balance)
      await testing.token.approve(
        testing.pod.address,
        await testing.token.balanceOf(testing.owner.address)
      );

      // ----------------------------------
      // depositTo() for Multuple Accounts
      // ----------------------------------
      testing.pod = testing.pod.connect(testing.owner);

      // pod.depositTo(alice, 25000 tokens)
      await advanceTimeAndBlock(1);
      await testing.pod.depositTo(
        testing.alice.address,
        utils.parseEther("25000")
      );

      // pod.depositTo(bob, 25000 tokens)
      await advanceTimeAndBlock(1);
      testing.pod = testing.pod.connect(testing.owner);
      await testing.pod.depositTo(
        testing.bob.address,
        utils.parseEther("25000")
      );

      // ----------------------------------
      // Convert token float to tickets
      // ----------------------------------
      // pod.batch()
      await testing.pod.batch(
        await testing.token.balanceOf(testing.pod.address)
      );

      // ----------------------------------
      // Start Distributing POOL
      // ----------------------------------

      // Advance 2 Weeks
      // ------------------------------
      await advanceTimeAndBlock(1209600);

      // claimPodPool() - Claim POOL for Pod
      await testing.pod.claimPodPool();

      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("44"), utils.parseEther("1"));

      // Alice Claim
      // ------------------------------
      // Alice Claim POOL allocation
      testing.pod = testing.pod.connect(testing.alice);
      await testing.pod.claim(testing.alice.address, testing.alice.address);

      expect(await testing.pool.balanceOf(testing.alice.address)).to.equalish(
        utils.parseEther("22"),
        utils.parseEther("1")
      );

      // BOB Claim
      // ------------------------------
      // Bob Claim POOL allocation
      testing.pod = testing.pod.connect(testing.bob);
      await testing.pod.claim(testing.bob.address, testing.bob.address);

      expect(await testing.pool.balanceOf(testing.bob.address)).to.equalish(
        utils.parseEther("22"),
        utils.parseEther("1")
      );

      // Verify Pod POOL Balance - Expect 0
      // ------------------------------
      expect(
        await testing.pool.balanceOf(testing.tokenDrop.address)
      ).to.equalish(utils.parseEther("0"), utils.parseEther("3"));
    });
  });
});
