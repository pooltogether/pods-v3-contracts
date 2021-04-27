const { ethers } = require("hardhat");
const { expect } = require("chai");
const { getConfig } = require("../lib/config");
const {
  setupSigners,
  createPodAndTokenDrop,
  createPodAndTokenDropFromStaticVariables,
  setupContractFactories,
  createPeripheryContract,
} = require("./utilities/contracts");
const { constants } = require("ethers");

describe("PodFactory", function () {
  let testing = {};
  const config = getConfig("mainnet");

  const podDAI = {
    prizePool: "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a",
    token: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ticket: "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF",
    pool: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e",
    faucet: "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb",
  };

  const prizePool = "0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a";
  const token = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const ticket = "0x334cBb5858417Aee161B53Ee0D5349cCF54514CF";
  const pool = "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e";
  const faucet = "0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb";

  before(async () => {
    testing = await setupSigners(testing);
    testing = await setupContractFactories(testing);
    testing = await createPeripheryContract(testing, config);
  });

  /******************|
  | Before Each
  /******************/
  beforeEach(async () => {
    const [pod, tokenDrop] = await createPodAndTokenDropFromStaticVariables(
      testing,
      podDAI
    );
    testing.pod = await ethers.getContractAt("Pod", pod);
    testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDrop);
  });

  // Test Basics
  // ----------------------------------------------------------------
  it("should have the TokenDropFactory reference", async function () {
    // tokenDropFactory()
    const tokenDropFactory = await testing.podFactory.tokenDropFactory();

    expect(tokenDropFactory).equal(testing.tokenDropFactory.address);
  });

  it("should have correct factory reference in Pod smart contract", async function () {
    // factory()
    const factory = await testing.pod.factory();
    expect(factory).equal(testing.podFactory.address);
  });

  it("should fail to create a new Pod with incorrect ticket", async function () {
    // create()
    const tokenDropFactory = testing.podFactory.create(
      prizePool,
      constants.AddressZero,
      pool,
      faucet,
      constants.AddressZero
    );

    await expect(tokenDropFactory).to.be.revertedWith(
      "Pod:initialize-invalid-ticket"
    );
  });

  it("should succeed creating a new Pod with with DAI settings", async function () {
    // callStatic.create()
    const tokenDropFactoryCallStatic = await testing.podFactory.callStatic.create(
      prizePool,
      ticket,
      pool,
      faucet,
      constants.AddressZero // PodLiquidatorManager
    );

    // create()
    const tokenDropFactory = testing.podFactory.create(
      prizePool,
      ticket,
      pool,
      faucet,
      constants.AddressZero // PodLiquidatorManager
    );

    // Validate Pod/TokenDrop using events.
    await expect(tokenDropFactory)
      .to.emit(testing.podFactory, "LogCreatedPodAndTokenDrop")
      .withArgs(tokenDropFactoryCallStatic[0], tokenDropFactoryCallStatic[1]);
  });

  it("should fail when setting token drop reference from not authorized account", async function () {
    testing.pod = testing.pod.connect(testing.alice);

    // setTokenDrop()
    const setTokenDrop = testing.pod.setTokenDrop(testing.token.address);
    // expect(setTokenDrop).equal(testing.podFactory.address);
    await expect(setTokenDrop).to.be.revertedWith(
      "Pod:unauthorized-set-token-drop"
    );
  });

  it("should fail when setting invalid token drop smart contract", async function () {
    // setTokenDrop()
    const setTokenDrop = testing.pod.setTokenDrop(constants.AddressZero);

    await expect(setTokenDrop).to.be.revertedWith("Pod:invalid-drop-contract");
  });
});
