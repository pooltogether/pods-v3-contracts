const { ethers, waffle } = require("hardhat");

const setupContractFactories = async (testing) => {
  // Contract Factories
  testing.POD = await ethers.getContractFactory("Pod");
  testing.POD_FACTORY = await ethers.getContractFactory("PodFactory");
  testing.TOKEN_DROP_FACTORY = await ethers.getContractFactory(
    "TokenDropFactory"
  );
  testing.POD_MANAGER = await ethers.getContractFactory("PodManager");
  testing.ERC20 = await ethers.getContractFactory(
    "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:ERC20Upgradeable",
  );

  return testing;
};

const setupSigners = async (testing) => {
  testing.provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545/"
  );

  testing.signers = await ethers.getSigners();
  testing.owner = testing.signers[0];
  testing.alice = testing.signers[1];
  testing.bob = testing.signers[2];
  testing.carl = testing.signers[3];
  testing.wallet = testing.signers[0];
  testing.wallet2 = testing.signers[1];
  testing.wallet3 = testing.signers[2];
  testing.wallet4 = testing.signers[3];

  return testing;
};

const createPeripheryContract = async (testing, addresses) => {
  // Set Token
  testing.token = await ethers.getContractAt(
    "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:ERC20Upgradeable",
    addresses.token
  );
  // Set Ticket
  testing.ticket = await ethers.getContractAt(
    "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:ERC20Upgradeable",
    addresses.ticket
  );

  // Set Pool
  testing.pool = await ethers.getContractAt(
    "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol:ERC20Upgradeable",
    addresses.reward
  );

  testing.reward = testing.pool


  return testing;
};

const createPodAndTokenDrop = async (testing, config) => {

  // Contract Factories
  testing.POD_FACTORY = await ethers.getContractFactory("PodFactory");
  testing.TOKEN_DROP_FACTORY = await ethers.getContractFactory(
    "TokenDropFactory"
  );
  testing.POD_MANAGER = await ethers.getContractFactory("PodManager");

  // Deploy PodManager Smart Contract
  testing.podManager = await testing.POD_MANAGER.deploy();

  // Deploy PodFactory Smart Contract
  testing.tokenDropFactory = await testing.TOKEN_DROP_FACTORY.deploy();

  // Deploy PodFactory Smart Contract
  testing.podFactory = await testing.POD_FACTORY.deploy(
    testing.tokenDropFactory.address
  );

  // CallStatic Create Pod/TokenDrop using PodFactory Smart Contract
  testing.podAddress = await testing.podFactory.callStatic.create(
    config.prizePool,
    config.ticket,
    config.faucet,
    testing.podManager.address,
    18
  );

  // Create Pod/TokenDrop using PodFactory Smart Contract
  testing.pod_and_tokendrop_create = await testing.podFactory.create(
    config.prizePool,
    config.ticket,
    config.faucet,
    testing.podManager.address,
    18
  );

  // const tokenDropAddress = await testing.pod.tokenDrop()
  return [testing.podAddress];
};

const createPodAndTokenDropFromStaticVariables = async (testing, config) => {

  // Contract Factories
  testing.POD_FACTORY = await ethers.getContractFactory("PodFactory");
  testing.TOKEN_DROP_FACTORY = await ethers.getContractFactory(
    "TokenDropFactory"
  );
  testing.POD_MANAGER = await ethers.getContractFactory("PodManager");

  // Deploy PodManager Smart Contract
  testing.podManager = await testing.POD_MANAGER.deploy();

  // Deploy PodFactory Smart Contract
  testing.tokenDropFactory = await testing.TOKEN_DROP_FACTORY.deploy();

  // Deploy PodFactory Smart Contract
  testing.podFactory = await testing.POD_FACTORY.deploy(
    testing.tokenDropFactory.address
  );

  // CallStatic Create Pod/TokenDrop using PodFactory Smart Contract
  testing.podAddress = await testing.podFactory.callStatic.create(
    config.prizePool,
    config.ticket,
    config.faucet,
    testing.podManager.address,
    18
  );

  // Create Pod/TokenDrop using PodFactory Smart Contract
  testing.pod_and_tokendrop_create = await testing.podFactory.create(
    config.prizePool,
    config.ticket,
    config.faucet,
    testing.podManager.address,
    18
  );

  testing.pod = await ethers.getContractAt(
    "Pod",
    testing.podAddress
  );

  const tokenDropAddress = await testing.pod.tokenDrop()

  testing.tokenDrop = await ethers.getContractAt("TokenDrop", tokenDropAddress);

  return [testing.podAddress, tokenDropAddress];
};

module.exports = {
  createPodAndTokenDrop,
  createPodAndTokenDropFromStaticVariables,
  setupContractFactories,
  createPeripheryContract,
  setupSigners,
};
