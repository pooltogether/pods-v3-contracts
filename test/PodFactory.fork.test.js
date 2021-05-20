const hardhat = require('hardhat')
const { expect } = require("chai");

const { prizePoolDefault } = require("./helpers/constants");
const {
  setupSigners,
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");

const { ethers } = hardhat
const { constants } = ethers;

describe("PodFactory", function () {
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
  });

  it("should have the TokenDropFactory reference", async function () {
    // tokenDropFactory()
    const tokenDropFactory = await testing.podFactory.tokenDropFactory();
    expect(tokenDropFactory).equal(testing.tokenDropFactory.address);
  });

  it("should fail deploying with an invalid TokenDropFactory", async function () {
    const failedPodFactoryDeploy = testing.POD_FACTORY.deploy(constants.AddressZero);
    await expect(failedPodFactoryDeploy).to.be.revertedWith("PodFactory:invalid-token-drop-factory");
  });
  
  it("should succesfully create a new Pod with an inactive faucet", async function () {
   const tokenDropFactory = testing.podFactory.create(
    prizePoolDefault.prizePool,
    prizePoolDefault.ticket,
    constants.AddressZero,
    owner,
    18
    );

    // Validate the LogCreatedPodAndTokenDrop event was emitted
    await expect(tokenDropFactory)
      .to.emit(testing.podFactory, "LogCreatedPodAndTokenDrop")
  });


  it("should fail to create a new Pod with incorrect ticket", async function () {
    // create()
    const tokenDropFactory = testing.podFactory.create(
      prizePoolDefault.prizePool,
      constants.AddressZero,
      prizePoolDefault.faucet,
      constants.AddressZero,
      18
    );

    await expect(tokenDropFactory).to.be.revertedWith(
      "Pod:initialize-invalid-ticket"
    );
  });

  it("should succeed creating a new Pod with with DAI settings", async function () {
    // callStatic.create()
    const tokenDropFactoryCallStatic =
      await testing.podFactory.callStatic.create(
        prizePoolDefault.prizePool,
        prizePoolDefault.ticket,
        prizePoolDefault.faucet,
        owner,
        18
      );

    // create()
    const tokenDropFactory = testing.podFactory.create(
      prizePoolDefault.prizePool,
      prizePoolDefault.ticket,
      prizePoolDefault.faucet,
      owner,
      18
    );

    pod = await ethers.getContractAt("Pod", tokenDropFactoryCallStatic);
    const tokenDropAddress = await pod.tokenDrop();

    // Validate Pod/TokenDrop using events.
    await expect(tokenDropFactory)
      .to.emit(testing.podFactory, "LogCreatedPodAndTokenDrop")
      .withArgs(tokenDropFactoryCallStatic, tokenDropAddress);
  });

});
