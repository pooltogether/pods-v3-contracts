const { utils } = require("ethers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

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

describe("TokenDrop", function() {
  let testing = {};
  const config = getConfig("mainnet");

  before(async () => {
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);
  });

  beforeEach(async () => {
    // Deploy PodNFT contract
    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);

    // Acquire POOL token
    await purchaseToken(
      config.tokens.WETH,
      config.tokens.POOL,
      utils.parseEther("500"),
      testing.owner.address,
      {
        UniswapRouter: config.contracts.UniswapRouter,
        exactAmount: true,
      }
    );
  });

  it("should check initial TokenDrop smart contract configuration", async function() {
    // totalUnclaimed()
    const totalUnclaimed = await testing.drop.totalUnclaimed();
    expect(totalUnclaimed.toString()).to.equal("0");

    // lastDripTimestamp()
    const lastDripTimestamp = await testing.drop.lastDripTimestamp();
    expect(lastDripTimestamp.toString()).to.equal("0");

    // exchangeRateMantissa()
    const exchangeRateMantissa = await testing.drop.exchangeRateMantissa();
    expect(exchangeRateMantissa.toString()).to.equal("0");

    // asset()
    const asset = await testing.drop.asset();
    expect(utils.getAddress(asset)).to.equal(
      utils.getAddress(config.tokens.POOL)
    );

    // measure()
    const measure = await testing.drop.measure();
    expect(measure).to.equal(testing.pod.address);
  });

  it("should check user states", async function() {
    // exchangeRateMantissa()
    const userStates = await testing.drop.userStates(testing.owner.address);
    expect(userStates[0].toString()).to.equal("0");
    expect(userStates[0].toString()).to.equal("0");
  });

  it("should check interface support", async function() {
    // exchangeRateMantissa()
    const supportsInterface = await testing.drop.supportsInterface(
      "0xffffffff"
    );
    expect(supportsInterface).to.equal(true);
  });

  it("should initialize new TokenDrop smart contract", async function() {
    // approve()
    const balanceOf = await testing.pool.balanceOf(testing.owner.address);

    // approve()
    await testing.pool.approve(
      testing.tokenDrop.address,
      utils.parseEther("1000000")
    );

    // addAssetToken()
    const addAssetTokenCallStatic = await testing.tokenDrop.callStatic.addAssetToken(
      utils.parseEther("1000")
    );
    await testing.tokenDrop.addAssetToken(utils.parseEther("1000"));
    expect(addAssetTokenCallStatic).to.equal(true);
  });
});
