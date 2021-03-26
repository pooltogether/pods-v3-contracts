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

describe("Pod - Claim", function() {
  const config = getConfig("mainnet");
  let testing = {};

  // DAI PrizePool Reference Object
  const podDAI = {
    prizePool: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a",
    token: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ticket: "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF",
    pool: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e",
    faucet: "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb",
  };

  // DAI PrizePool References
  const prizePool = "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a";
  const token = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const ticket = "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF";
  const pool = "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e";
  const faucet = "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb";

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

    // Acquire POOL Token
    await purchaseToken(
      config.tokens.WETH,
      pool,
      ethers.utils.parseEther("2000"),
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

  it("should fail to claim from non-existant TokenDrop", async function() {
    await expect(
      testing.pod.claim(testing.owner.address, constants.AddressZero)
    ).to.be.revertedWith("Pod:invalid-token-drop");
  });

  it("should claim 0 when pod has no previous or current token balance", async function() {
    // callStatic.claim()
    const claimStatic = await testing.pod.callStatic.claim(
      testing.owner.address,
      token
    );

    // claim()
    const claim = testing.pod.claim(testing.owner.address, token);

    // Validate Pod/TokenDrop using events.
    await expect(claim)
      .to.emit(testing.pod, "Claimed")
      .withArgs(testing.owner.address, toWei("0"));

    expect(claimStatic).to.equal("0");
  });

  it("should claim 100 POOL after TokenDrop has 1000 POOl for 1 Month", async function() {
    // Add POOL to to TokenDrop
    await testing.pool.approve(
      testing.tokenDrop.address,
      utils.parseEther("1000")
    );
    await testing.tokenDrop.addAssetToken(utils.parseEther("1000"));

    // Deposit Token to Pod

    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // balanceOf()
    const balanceOfTokenDrop = await testing.pool.balanceOf(
      testing.tokenDrop.address
    );

    // depositTo()
    await testing.pod.depositTo(
      testing.alice.address,
      utils.parseEther("1000")
    );

    // batch()
    await testing.pod.batch(utils.parseEther("1000"));

    // Advance 1 Month
    await advanceTimeAndBlock(2592000);

    // callStatic.claim()
    const claimStatic = await testing.pod.callStatic.claim(
      testing.owner.address,
      token
    );

    // claim()
    const claim = testing.pod.claim(testing.owner.address, token);

    // Validate Pod/TokenDrop using events.
    await expect(claim)
      .to.emit(testing.pod, "Claimed")
      .withArgs(testing.owner.address, toWei("0"));

    expect(claimStatic).to.equal("0");
  });
});
