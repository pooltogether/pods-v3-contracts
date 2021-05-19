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

describe("Pod - Deposit", function () {
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
    TOKEN_FACTORY = await ethers.getContractFactory("Token");

    mockedToken = await mockSafeERC20(wallet);
    mockedToken = await mockERC20InitializeBasics(await mockERC20(wallet), {
      name: "Token Test",
      symbol: "TEST",
    });
    mockedTicket = await mockERC20InitializeBasics(await mockERC20(wallet), {
      name: "Token Ticket",
      symbol: "TICKET",
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

    erc20Token = await TOKEN_FACTORY.deploy();
    erc20Ticket = await TOKEN_FACTORY.deploy();
    erc20Reward = await TOKEN_FACTORY.deploy();

    await mockedPrizePool.mock.token.returns(erc20Token.address);
    await mockedPrizePool.mock.tokens.returns([
      erc20Ticket.address,
      erc20Ticket.address,
    ]);

    // Read Future Pod Address
    podAddress = await podFactory.callStatic.create(
      mockedPrizePool.address,
      erc20Ticket.address,
      mockedTokenFaucet.address,
      walletAddress,
      18
    );

    // Create Pod
    pod = await podFactory.create(
      mockedPrizePool.address,
      erc20Ticket.address,
      mockedTokenFaucet.address,
      walletAddress,
      18
    );

    pod = await ethers.getContractAt("Pod", podAddress);
    tokenDrop = await ethers.getContractAt("TokenDrop", await pod.tokenDrop());
  });

  it("should batch succesfully a float", async function () {
    await erc20Token.approve(pod.address, utils.parseEther("1000"))
    await pod.depositTo(walletAddress, utils.parseEther("1000"));

    // console.log(mockedPrizePool, 'mockedPrizePool.address')

    await mockedPrizePool.mock.depositTo.withArgs(
      pod.address,
      utils.parseEther("1000"),
      erc20Ticket.address,
      pod.address
    ).returns();

    await pod.batch();
  });
  
  it("should withdraw succesfully after running batch", async function () {
    await erc20Token.approve(pod.address, utils.parseEther("1000"))
    await pod.depositTo(walletAddress, utils.parseEther("1000"));

    await mockedPrizePool.mock.depositTo.withArgs(
      pod.address,
      utils.parseEther("1000"),
      erc20Ticket.address,
      pod.address
    ).returns();

    await pod.batch();

    await mockedPrizePool.mock.calculateEarlyExitFee
    .withArgs(pod.address, mockedTicket.address, utils.parseEther("1000"))
    .returns(utils.parseEther("10"), utils.parseEther("10"));

    const getEarlyExitFee = await pod.callStatic.getEarlyExitFee(
      utils.parseEther("1000")
    );

    const walletBalanceOfBefore =  await pod.balanceOf(walletAddress);
    console.log(walletBalanceOfBefore.toString(), 'walletBalanceOfBefore')

    await pod.withdraw(utils.parseEther("1000"), getEarlyExitFee);

    const walletBalanceOfAfter =  await pod.balanceOf(walletAddress);
    console.log(walletBalanceOfAfter.toString(), 'walletBalanceOfAfter')

    expect(walletBalanceOfAfter).equal(utils.parseEther("0"));

  });
});
