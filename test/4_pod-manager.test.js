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

describe("PodManager", function() {
  let testing = {};
  const config = getConfig("mainnet");

  before(async () => {
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);

    testing.POD_NFT = await ethers.getContractFactory("PodNFT");

    // Set Ticket
    testing.USDC = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
      config.tokens.USDC
    );
  });

  /******************|
  | Before Each
  /******************/
  beforeEach(async () => {
    // Set PodManager contract
    testing.podManager = await testing.POD_MANAGER.deploy();

    const [pod, tokenDrop] = await createPodAndTokenDrop(testing, config);
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);

    await testing.pod.setManager(testing.podManager.address);
  });

  /************************************|
  | PodManager - ERC20 Liquidate
  /************************************/
  describe("ERC20 Liquidate", function() {
    before(async () => {});

    beforeEach(async () => {
      // Acquire USDC Testing Token
      await purchaseToken(
        config.tokens.WETH,
        config.tokens.USDC,
        utils.parseUnits("120000000000000", 6),
        testing.owner.address,
        {
          UniswapRouter: config.contracts.UniswapRouter,
          // exactAmount: true,
        }
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
        config.tokens.USDC,
        utils.parseUnits("1000", 6),
        utils.parseEther("0"),
        [config.tokens.USDC, config.tokens.WETH, config.podDAI.token] // USDC => WETH => DAI
      );

      expect(await testing.USDC.balanceOf(testing.pod.address)).to.equal(
        toWei("0")
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
