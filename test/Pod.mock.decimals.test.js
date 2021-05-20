const hardhat = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { utils } = require("ethers");

const {
  mockERC20,
  mockERC20InitializeBasics,
  mockSafeERC20,
  mockPrizePool,
  mockPrizePoolInitializeBasics,
  mockTokenFaucet,
  mockTokenFaucetInitializeBasics,
  mockPrizeStrategy,
} = require("./helpers/mocks");

describe("Pod (6 Decimals) - Mock", function () {
  let wallet;
  let walletAddress;
  let pod, tokenDrop;

  let mockedPrizePool,
    mockedToken,
    mockedReward,
    mockedTokenFaucet,
    mockedPrizeStategy;
  let POD_FACTORY, TOKEN_DROP_FACTORY;
  let podFactory, tokenDropFactory;

  let provider;

  before(async () => {
    provider = hardhat.ethers.provider;

    [wallet, wallet2, wallet3, wallet4] = await ethers.getSigners();
    walletAddress = wallet.address;

    POD_FACTORY = await ethers.getContractFactory("PodFactory");
    TOKEN_DROP_FACTORY = await ethers.getContractFactory("TokenDropFactory");

    mockedToken = await mockSafeERC20(wallet);
    mockedToken = await mockERC20InitializeBasics(await mockERC20(wallet), {
      name: "Token Test",
      symbol: "TEST",
      decimals: 6,
    });
    mockedTicket = await mockERC20InitializeBasics(await mockERC20(wallet), {
      name: "Token Ticket",
      symbol: "TICKET",
      decimals: 6,
    });
    mockedReward = await mockERC20InitializeBasics(await mockERC20(wallet), {
      name: "Token Reward",
      symbol: "RWRD",
    });

    mockedTokenFaucet = await mockTokenFaucetInitializeBasics(
      await mockTokenFaucet(wallet),
      {
        measure: mockedReward.mockedToken,
        asset: mockedReward.address,
      }
    );

    mockedPrizeStrategy = await mockPrizeStrategy(wallet);
    mockedPrizeStrategy.mock.isRngRequested.returns(false);
    mockedPrizePool = await mockPrizePoolInitializeBasics(
      await mockPrizePool(wallet),
      {
        faucet: mockedTokenFaucet.address,
        token: mockedToken.address,
      }
    );

    mockedPrizePool.mock.prizeStrategy.returns(mockedPrizeStrategy.address);
  });

  /******************|
  | Before Each
  /******************/
  beforeEach(async () => {
    tokenDropFactory = await TOKEN_DROP_FACTORY.deploy();
    podFactory = await POD_FACTORY.deploy(tokenDropFactory.address);

    await mockedPrizePool.mock.token.returns(mockedToken.address);
    await mockedPrizePool.mock.tokens.returns([
      mockedTicket.address,
      mockedTicket.address,
    ]);

    // Read Future Pod Address
    podAddress = await podFactory.callStatic.create(
      mockedPrizePool.address,
      mockedTicket.address,
      mockedTokenFaucet.address,
      walletAddress,
      6
    );

    // Create Pod
    pod = await podFactory.create(
      mockedPrizePool.address,
      mockedTicket.address,
      mockedTokenFaucet.address,
      walletAddress,
      6
    );

    pod = await ethers.getContractAt("Pod", podAddress);
    tokenDrop = await ethers.getContractAt("TokenDrop", await pod.tokenDrop());
  });

  it("should have matching decimals for token, ticket and pod", async function () {

    const tName = await mockedToken.name();

    // Pod Name
    const name = await pod.name();
    expect(name).equal(`Pod ${tName}`);
  });
  it("should have the correct name", async function () {
    const tName = await mockedToken.name();

    // Pod Name
    const name = await pod.name();
    expect(name).equal(`Pod ${tName}`);
  });

  it("should have the correct symbol", async function () {
    const tSymbol = await mockedToken.symbol();

    // Pod Symbol
    const symbol = await pod.symbol();
    expect(symbol).equal(`p${tSymbol}`);
  });

  it("should have the correct prize pool", async function () {
    // PrizePool
    const prizePool = await pod.prizePool();
    expect(prizePool).equal(mockedPrizePool.address);
  });

  it("should have the correct deposit token", async function () {
    // Token
    const token = await pod.token();
    const prizePoolToken = await mockedPrizePool.token();
    expect(token).equal(prizePoolToken);
  });

  it("should have the correct ticket token", async function () {
    // Ticket
    const ticket = await pod.ticket();
    expect(ticket).equal(mockedTicket.address);
  });
  
  it("should be able to set target token approve to zero ", async function () {
    await mockedToken.mock.approve
      .withArgs(tokenDrop.address, utils.parseEther("0"))
      .returns(true);
    const ticket = await pod.emergencyTokenApproveZero(mockedToken.address, tokenDrop.address);
  });

  it("should have 1 as default for price per share", async function () {
    const getPricePerShare = await pod.getPricePerShare();
    expect(getPricePerShare).equal(utils.parseUnits("1", 6));
  });

  it("should have 2 as default for price per share", async function () {
    await mockedToken.mock.transferFrom
      .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
      .returns(true);

    await pod.depositTo(walletAddress, utils.parseUnits("1000", 6));

    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("2000"));
    await mockedTicket.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("0"));

    const balanceOfUnderlying = await pod.getPricePerShare();
    expect(balanceOfUnderlying).equal(utils.parseEther("2"));
  });

  it("should have 0 as default for balance underlying with no deposits", async function () {
    const balanceOfUnderlying = await pod.balanceOfUnderlying(walletAddress);
    expect(balanceOfUnderlying).equal(utils.parseEther("0"));
  });

  it("the share amount should match the underlying balance", async function () {
    await mockedToken.mock.transferFrom
      .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
      .returns(true);

    await pod.depositTo(walletAddress, utils.parseUnits("1000", 6));

    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseUnits("1000", 6));
    await mockedTicket.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("0"));

    const balanceOfUnderlying = await pod.balanceOfUnderlying(walletAddress);
    expect(balanceOfUnderlying).equal(utils.parseUnits("1000", 6));
  });

  it("pod should revert when depositing 0 tokens", async function () {
    await expect(
      pod.depositTo(walletAddress, utils.parseEther("0"))
    ).to.be.revertedWith("Pod:invalid-amount");
  });

  it("should succeed when depositing above 0", async function () {
    await mockedToken.mock.transferFrom
      .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
      .returns(true);

    // depositTo()
    const depositTo = await pod.depositTo(
      walletAddress,
      utils.parseUnits("1000", 6)
    );

    // getTransactionReceipt(depositTo.hash)
    let receipt = await provider.getTransactionReceipt(depositTo.hash);

    // Check All Events
    expect(pod.interface.parseLog(receipt.logs[0]).name).to.equal("Transfer");
    expect(pod.interface.parseLog(receipt.logs[1]).name).to.equal("Deposited");
  });

  it("should succeed when multiple accounts have shares", async function () {
    await mockedToken.mock.transferFrom
      .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
      .returns(true);

    // depositTo()
    await pod.depositTo(
      walletAddress,
      utils.parseUnits("1000", 6)
    );

    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseUnits("1000", 6));
    await mockedTicket.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("0"));

    await mockedToken.mock.transferFrom
      .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
      .returns(true);

    await pod.depositTo(
      wallet2.address,
      utils.parseUnits("1000", 6)
    );

    const totalSupply = await pod.totalSupply();
      
    // Check All Events
    expect(totalSupply).to.equal(utils.parseUnits("2000", 6));
  });

  it("should have 0 balance when pod is empty", async function () {
    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("0"));
    await mockedTicket.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseEther("0"));

    const balance = await pod.balance();

    expect(balance).equal(utils.parseEther("0"));
  });

  it("should have 0 exit fee when float is sufficient", async function () {
    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseUnits("1000", 6));

    const getEarlyExitFee = await pod.callStatic.getEarlyExitFee(
      utils.parseUnits("500", 6)
    );

    expect(getEarlyExitFee).equal(utils.parseEther("0"));
  });
  it("should calculate the exit fee using the prizePool when float is insufficient", async function () {
    await mockedToken.mock.balanceOf
      .withArgs(pod.address)
      .returns(utils.parseUnits("1000", 6));

    await mockedPrizePool.mock.calculateEarlyExitFee
      .withArgs(pod.address, mockedTicket.address, utils.parseUnits("500", 6))
      .returns(utils.parseUnits("5", 6), utils.parseUnits("5", 6));

    const getEarlyExitFee = await pod.callStatic.getEarlyExitFee(
      utils.parseUnits("1500", 6)
    );

    expect(getEarlyExitFee).equal(utils.parseUnits("5", 6));
  });

  // it("should batch succesfully", async function () {
  //   await mockedToken.mock.transferFrom
  //     .withArgs(walletAddress, pod.address, utils.parseUnits("1000", 6))
  //     .returns(true);

  //   await pod.depositTo(walletAddress, utils.parseUnits("1000", 6));

  //   await mockedToken.mock.balanceOf
  //     .withArgs(pod.address)
  //     .returns(utils.parseUnits("1000", 6));

  //   await mockedToken.mock.approve
  //     .withArgs(mockedPrizePool.address, utils.parseUnits("1000", 6))
  //     .returns(true);

  //   await mockedPrizePool.mock.depositTo
  //     .withArgs(
  //       mockedPrizePool.address,
  //       utils.parseUnits("1000", 6),
  //       mockedPrizePool.address,
  //       mockedTicket.address
  //     )
  //     .returns();

  //   await pod.batch();

  //   // await pod.depositTo(walletAddress, utils.parseUnits("1000", 6));
  // });

  // describe("Pod - Live Tokens", function () {
  //   before(async () => {
  //     TOKEN_FACTORY = await ethers.getContractFactory("Token");

  //     erc20Token = await TOKEN_FACTORY.deploy();

  //     console.log(erc20Token, "erc20Tokenerc20Token");
  //   });
  // });
});
