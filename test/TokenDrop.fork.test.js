require("./helpers/chaiMatchers");
const hardhat = require('hardhat')
const { utils, constants } = require("ethers");
const { expect } = require("chai");

const { prizePoolDefault } = require("./helpers/constants");
const { purchaseToken } = require("../lib/uniswap");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

const { ethers } = hardhat

describe("TokenDrop", function() {
  let testing = {};

  let owner
  let pod, tokenDrop
  let wallet, wallet2, wallet3, wallet4

  // Constants
  const PARSED_1000 = ethers.utils.parseEther("1000")

  before(async () => {
    [wallet, wallet2, wallet3, wallet4] = await ethers.getSigners()
    owner = wallet.address
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, prizePoolDefault);

    // Acquire DAI Token
    await purchaseToken(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
      ethers.utils.parseEther("30"),
      wallet.address,
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );

    // Acquire POOL Token
    await purchaseToken(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e', // POOL
      ethers.utils.parseEther("100"),
      wallet.address,
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );

  });

  beforeEach(async () => {
    const [podAddress] = await createPodAndTokenDrop(testing, prizePoolDefault);
    pod = await ethers.getContractAt("Pod", podAddress);
    tokenDrop = await ethers.getContractAt("TokenDrop", await pod.tokenDrop());
  });

  it("should validate initial total unclaimed", async function() {
    // totalUnclaimed()
    const totalUnclaimed = await tokenDrop.totalUnclaimed();
    expect(totalUnclaimed.toString()).to.equal("0");
  })
  it("should validate initial last drip timestamp", async function() {
    // lastDripTimestamp()
    const lastDripTimestamp = await tokenDrop.lastDripTimestamp();
    expect(lastDripTimestamp.toString()).to.equal("0");
  })
  it("should validate initial exchange rate mantissa", async function() {
    // exchangeRateMantissa()
    const exchangeRateMantissa = await tokenDrop.exchangeRateMantissa();
    expect(exchangeRateMantissa.toString()).to.equal("0");
  })
  
  it("should validate asset token", async function() {
    const asset = await tokenDrop.asset();
    expect(utils.getAddress(asset)).to.equal(
      utils.getAddress(prizePoolDefault.reward)
    );
  })

  it("should validate measure token", async function() {
    const measure = await tokenDrop.measure();
    expect(measure).to.equal(pod.address);
  });

  it("should fail to create a TokenDrop contract with invalid measure token", async function() {
    const failedDeploy = testing.tokenDropFactory.create(constants.AddressZero, testing.reward.address)
    await expect(failedDeploy).to.be.revertedWith("Pod:invalid-measure-token");
  });
  
  it("should fail to create a TokenDrop contract with invalid asset token", async function() {
    const failedDeploy = testing.tokenDropFactory.create(testing.reward.address, constants.AddressZero)
    await expect(failedDeploy).to.be.revertedWith("Pod:invalid-asset-token");
  });

  it("should check user states with no rewards", async function() {
    const userStates = await tokenDrop.userStates(owner);
    expect(userStates[0].toString()).to.equal("0");
  });
  
  it("should add asset token to claim reserve", async function() {
    const balanceOfBefore =  await testing.reward.balanceOf(tokenDrop.address)
    expect(balanceOfBefore).to.equal("0");
    
    await testing.reward.approve(tokenDrop.address, PARSED_1000)
    const addAssetToken = await tokenDrop.addAssetToken(PARSED_1000);
    
    const balanceOfAfter =  await testing.reward.balanceOf(tokenDrop.address)
    expect(balanceOfAfter).to.equal(PARSED_1000);
  });
  
  it("should claim tokens for users", async function() {

    // Transfer reward token to TokenDrop
    await testing.reward.approve(tokenDrop.address, PARSED_1000)
    await tokenDrop.addAssetToken(PARSED_1000);

    // Transfer deposit token to Pod
    await testing.token.approve(pod.address, ethers.utils.parseEther("1000"));
    await pod.depositTo(owner, ethers.utils.parseEther("1000"));

    // Distribute reward token to Pod share holders 
    const drop = tokenDrop.drop()
    
    // Validate the Dropped event was emitted via the newTokens and measureTotalSupply conditionals
    await expect(drop)
    .to.emit(tokenDrop, "Dropped")
    .withArgs(PARSED_1000);
    
    // Claim reward token from TokenDrop
    const claimed = tokenDrop.claim(owner);

    // Validate the Claimed event was emitted with the owners claimed amount.
    await expect(claimed)
      .to.emit(tokenDrop, "Claimed")
      .withArgs(owner, '1000000000000000000000');
  });

});
