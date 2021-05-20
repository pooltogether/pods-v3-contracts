const hardhat = require("hardhat");
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
const { utils, constants } = ethers

describe("PodManager - Fork", function() {
  let testing = {};
  let POOL = '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e'
  let USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
  let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

  before(async () => {
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, prizePoolDefault);
    testing.POD_NFT = await ethers.getContractFactory("PodNFT");

    // Set Ticket
    testing.USDC = await ethers.getContractAt(
      "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:ERC20Upgradeable",
      USDC
    );

    await purchaseToken(
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e', // POOL
      ethers.utils.parseEther("5"),
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

    await testing.pod.setManager(testing.podManager.address);
  });

  it("should fail transfering pod token via withdrawERC20 ", async function() {
    const token = await testing.pod.token()
    const withdrawERC20 = testing.pod.withdrawERC20(token, utils.parseEther('1000'));
    expect(withdrawERC20)
      .to.be.revertedWith("Pod:invalid-target-token");
  });
  
  it("should fail transfering pod ticket via withdrawERC20 ", async function() {
    const ticket = await testing.pod.ticket()
    const withdrawERC20 = testing.pod.withdrawERC20(ticket, utils.parseEther('1000'));
    expect(withdrawERC20)
      .to.be.revertedWith("Pod:invalid-target-token");
  });
  
  it("should fail transfering pod token drop asset via withdrawERC20 ", async function() {
    const asset = await testing.tokenDrop.asset()
    const withdrawERC20 = testing.pod.withdrawERC20(asset, utils.parseEther('1000'));
    expect(withdrawERC20)
      .to.be.revertedWith("Pod:invalid-target-token");
  });
  
  it("should succeed transfering pod token drop asset via withdrawERC20 after ", async function() {
    await testing.reward.transfer(testing.pod.address, utils.parseEther('10'))

    await testing.pod.setTokenDrop(constants.AddressZero)
    const asset = await testing.tokenDrop.asset()
    const withdrawERC20 = testing.pod.withdrawERC20(asset, utils.parseEther('10'));

    await expect(withdrawERC20)
      .to.emit(testing.pod, "ERC20Withdrawn")
      .withArgs(asset, utils.parseEther('10'));
  });

  /************************************|
  | PodManager - ERC20 Liquidate
  /************************************/
  describe("ERC20 Liquidate", function() {
    before(async () => {});

    beforeEach(async () => {
      await purchaseToken(
        WETH, // WETH
        USDC, // USDC
        utils.parseEther("30"),
        testing.owner.address,
        {
          UniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
          exactAmount: true,
        }
      );
    });

    it("should fail withdrawing non-core ERC20 target asset as EOA", async function() {
      // USDC.transfer(pod, 1000)
      await testing.USDC.transfer(
        testing.pod.address,
        utils.parseUnits("1000", 6)
      );

      expect(await testing.USDC.balanceOf(testing.pod.address)).to.equal(
        utils.parseUnits("1000", 6)
      );

      // setManager()
      await testing.pod.setManager(testing.owner.address);

      // withdrawERC20()
      expect(
        testing.pod.withdrawERC20(POOL, utils.parseUnits("1000"))
      ).to.be.revertedWith("Pod:invalid-target-token");
    });

    it("should succeed withdrawing non-core ERC20 target asset as EOA", async function() {
      // USDC.transfer(pod, 1000)
      await testing.USDC.transfer(
        testing.pod.address,
        utils.parseUnits("1000", 6)
      );

      expect(await testing.USDC.balanceOf(testing.pod.address)).to.equal(
        utils.parseUnits("1000", 6)
      );

      await testing.pod.setManager(testing.owner.address);

      // withdrawERC20()
      await testing.pod.withdrawERC20(
        USDC,
        utils.parseUnits("1000", 6)
      );
    });

    // POD TokenDrop Core Settings
    it("should liquidate Pod assets and transfer liquidate assets", async function() {
      // USDC.transfer(pod, 1000)
      await testing.USDC.transfer(
        testing.pod.address,
        utils.parseUnits("1000", 6)
      );

      expect(await testing.USDC.balanceOf(testing.pod.address)).to.equal(
        utils.parseUnits("1000", 6)
      );

      // liquidate() - liquidate USDC to DAI for Pod
      await testing.podManager.liquidate(
        testing.pod.address,
        USDC,
        utils.parseUnits("1000", 6),
        utils.parseEther("0"),
        [USDC, WETH, DAI] // USDC => WETH => DAI
      );

      expect(await testing.USDC.balanceOf(testing.pod.address)).to.equal(
        utils.parseEther("0")
      );
    });
  });

  /************************************|
  | PodManager - ERC721 Liquidate
  /************************************/
  describe("ERC721 Withdraw", function() {
    before(async () => {});

    beforeEach(async () => {
      // Deploy PodNFT contract
      testing.podNFT = await testing.POD_NFT.deploy("PodNFT", "POD");
    });

    // POD TokenDrop Core Settings
    it("should withdraw ERC721 target asset as EOA", async function() {
      // Transfer NFT to Pod
      await testing.podNFT.transferFrom(
        testing.owner.address,
        testing.pod.address,
        1
      );

      // Check Owner holds NFT
      const tokenOwnerBeforeWithdraw = await testing.podNFT.ownerOf(1);
      expect(tokenOwnerBeforeWithdraw).to.equal(testing.pod.address);

      // setManager()
      await testing.pod.setManager(testing.owner.address);

      // withdrawCollectible() - Withdraw NFT from Pod
      await testing.pod.withdrawERC721(testing.podNFT.address, 1);

      // Check Owner holds NFT
      const tokenOwnerAfterWithdraw = await testing.podNFT.ownerOf(1);
      expect(tokenOwnerAfterWithdraw).to.equal(testing.owner.address);
    });
  });

  describe("ERC721 Withdraw", function() {
    before(async () => {});

    beforeEach(async () => {
      // Deploy PodNFT contract
      testing.podNFT = await testing.POD_NFT.deploy("PodNFT", "POD");
    });

    // POD TokenDrop Core Settings
    it("should withdraw Pod NFT and transfer to PodManager owner", async function() {
      // Transfer NFT to Pod
      await testing.podNFT.transferFrom(
        testing.owner.address,
        testing.pod.address,
        1
      );

      // Check Owner holds NFT
      const tokenOwnerBeforeWithdraw = await testing.podNFT.ownerOf(1);
      expect(tokenOwnerBeforeWithdraw).to.equal(testing.pod.address);

      // withdrawCollectible() - Withdraw NFT from Pod
      const liquidate = testing.podManager.withdrawCollectible(
        testing.pod.address,
        testing.podNFT.address,
        1
      );

      // Event LogLiquidatedERC721
      await expect(liquidate)
        .to.emit(testing.podManager, "LogLiquidatedERC721")
        .withArgs(testing.podNFT.address, 1);

      // Check Owner holds NFT
      const tokenOwnerAfterWithdraw = await testing.podNFT.ownerOf(1);
      expect(tokenOwnerAfterWithdraw).to.equal(testing.owner.address);
    });
  });
});
