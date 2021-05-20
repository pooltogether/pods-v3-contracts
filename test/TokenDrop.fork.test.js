require("./helpers/chaiMatchers");
const hardhat = require('hardhat')
const { utils } = require("ethers");
const { expect } = require("chai");

const { prizePoolDefault } = require("./helpers/constants");
const { purchaseToken } = require("../lib/uniswap");
const { getConfig } = require("../lib/config");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

const { ethers } = hardhat

describe("TokenDrop", function() {
  const config = getConfig("mainnet");
  let testing = {};

  let owner
  let pod, tokenDrop
  let wallet, wallet2, wallet3, wallet4

  before(async () => {
    [wallet, wallet2, wallet3, wallet4] = await ethers.getSigners()
    owner = wallet.address
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, prizePoolDefault);
  });

  beforeEach(async () => {
    const [podAddress] = await createPodAndTokenDrop(testing, prizePoolDefault);
    pod = await ethers.getContractAt("Pod", podAddress);
    tokenDrop = await ethers.getContractAt("TokenDrop", await pod.tokenDrop());

    // Acquire DAI Token
    await purchaseToken(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
      ethers.utils.parseEther("20"),
      owner,
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );

    // Acquire POOL Token
    await purchaseToken(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e',
      ethers.utils.parseEther("200"),
      await pod.tokenDrop(),
      {
        UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        exactAmount: true,
      }
    );

    // await tokenDrop.drop()

  });

  it("should check initial TokenDrop smart contract configuration", async function() {
    // totalUnclaimed()
    const totalUnclaimed = await tokenDrop.totalUnclaimed();
    expect(totalUnclaimed.toString()).to.equal("0");

    // lastDripTimestamp()
    const lastDripTimestamp = await tokenDrop.lastDripTimestamp();
    expect(lastDripTimestamp.toString()).to.equal("0");

    // exchangeRateMantissa()
    const exchangeRateMantissa = await tokenDrop.exchangeRateMantissa();
    expect(exchangeRateMantissa.toString()).to.equal("0");

    // asset()
    const asset = await tokenDrop.asset();
    expect(utils.getAddress(asset)).to.equal(
      utils.getAddress(prizePoolDefault.reward)
    );

    // measure()
    const measure = await tokenDrop.measure();
    expect(measure).to.equal(pod.address);
  });

  it("should check user states", async function() {
    // exchangeRateMantissa()
    const userStates = await tokenDrop.userStates(owner);
    expect(userStates[0].toString()).to.equal("0");
  });
  
  it("should claim tokens for users", async function() {
    await testing.token.approve(pod.address, ethers.utils.parseEther("1000"));
    await pod.depositTo(owner, ethers.utils.parseEther("1000"));

    await tokenDrop.drop()

    const claimed = await tokenDrop.claim(owner);

    // await expect(claimed)
    //   .to.emit(tokenDrop, "Claimed")
    //   .withArgs(owner, '2303157808647286538000');
  });

});
