const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const debug = require("debug")("pod:PodEssentials.test");
const { getConfig } = require("../lib/config");
const { purchaseToken } = require("../lib/uniswap");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");
const { utils } = require("ethers");

describe("Pod", function() {
  let testing = {};
  const config = getConfig("mainnet");

  before(async () => {
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

  /******************|
  | Before Each
  /******************/
  beforeEach(async () => {
    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);
  });

  /******************|
  | Test Basics
  /******************/
  it("should have the correct name", async function() {
    const tName = await testing.token.name();

    // Pod Name
    const name = await testing.pod.name();
    expect(name).equal(`pPod ${tName}`);
  });

  it("should have the correct symbol", async function() {
    const tSymbol = await testing.token.symbol();

    // Pod Symbol
    const symbol = await testing.pod.symbol();
    expect(symbol).equal(`pp${tSymbol}`);
  });

  it("should have the correct prize pool", async function() {
    // PrizePool
    const prizePool = await testing.pod.prizePool();
    expect(prizePool).equal(config.podDAI.prizePool);
  });

  it("should have the correct deposit token", async function() {
    // Token
    const token = await testing.pod.token();
    expect(token).equal(config.podDAI.token);
  });

  it("should have the correct ticket token", async function() {
    // Ticket
    const ticket = await testing.pod.ticket();
    expect(ticket).equal(config.podDAI.ticket);
  });

  it("should have the correct pool token", async function() {
    // PoolToken
    const pool = await testing.pod.pool();
    expect(pool).equal(config.podDAI.pool);
  });

  it("should have 0 pool token", async function() {
    // vaultPoolBalance()
    const vaultPoolBalance = await testing.pod.vaultPoolBalance();
    expect(vaultPoolBalance).equal(utils.parseEther("0"));
  });

  it("should have 0 pool token", async function() {
    // vaultPoolBalance()
    const vaultPoolBalance = await testing.pod.vaultPoolBalance();
    expect(vaultPoolBalance).equal(utils.parseEther("0"));
  });

  it("should have 0 getPricePerShare", async function() {
    // getPricePerShare()
    const getPricePerShare = await testing.pod.getPricePerShare();
    expect(getPricePerShare).equal(utils.parseEther("0"));
  });

  it("should have 1 getPricePerShare", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );

    // totalSupply()
    const totalSupply = await testing.pod.totalSupply();
    expect(totalSupply).equal(utils.parseEther("1000"));

    console.log(totalSupply.toString(), "totalSupply");

    // getPricePerShare()
    const getPricePerShare = await testing.pod.getPricePerShare();
    expect(getPricePerShare).equal(utils.parseEther("1"));
  });

  it("should have 0 getUserPricePerShare", async function() {
    // getUserPricePerShare()
    const getUserPricePerShare = await testing.pod.getUserPricePerShare(
      testing.owner.address
    );
    expect(getUserPricePerShare).equal(utils.parseEther("0"));
  });

  it("should have 1 getUserPricePerShare", async function() {
    // approve()
    await testing.token.approve(testing.pod.address, utils.parseEther("1000"));

    // depositTo()
    await testing.pod.depositTo(
      testing.owner.address,
      utils.parseEther("1000")
    );

    // totalSupply()
    const totalSupply = await testing.pod.totalSupply();
    expect(totalSupply).equal(utils.parseEther("1000"));

    console.log(totalSupply.toString(), "totalSupply");

    // getUserPricePerShare()
    const getUserPricePerShare = await testing.pod.getUserPricePerShare(
      testing.owner.address
    );
    expect(getUserPricePerShare).equal(utils.parseEther("1"));
  });
});
