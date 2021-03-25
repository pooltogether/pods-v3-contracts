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
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20"
  );

  // Deploy PodManager Smart Contract
  // testing.podManager = await testing.POD_MANAGER.deploy();

  // // Deploy PodFactory Smart Contract
  // testing.tokenDropFactory = await testing.TOKEN_DROP_FACTORY.deploy();
  // testing.podFactory = await testing.POD_FACTORY.deploy(
  //   testing.tokenDropFactory.address
  // );

  return testing;
};

const setupSigners = async (testing) => {
  testing.provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8543/"
  );

  testing.signers = await ethers.getSigners();
  testing.owner = testing.signers[0];
  testing.alice = testing.signers[1];
  testing.bob = testing.signers[2];
  testing.carl = testing.signers[3];

  return testing;
};

const createPeripheryContract = async (testing, config) => {
  // Set Token
  testing.token = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    config.podDAI.token
  );

  // Set Pool
  testing.pool = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    config.podDAI.pool
  );

  // Set Ticket
  testing.ticket = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    config.podDAI.ticket
  );

  return testing;
};
const createPodAndTokenDrop = async (testing, config) => {
  // console.log(testing, config, "testing, config");

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
  testing.pod_and_tokendrop_static = await testing.podFactory.callStatic.create(
    config.podDAI.prizePool,
    config.podDAI.token,
    config.podDAI.ticket,
    config.podDAI.pool,
    config.podDAI.faucet,
    testing.podManager.address
  );

  // Create Pod/TokenDrop using PodFactory Smart Contract
  testing.pod_and_tokendrop_create = await testing.podFactory.create(
    config.podDAI.prizePool,
    config.podDAI.token,
    config.podDAI.ticket,
    config.podDAI.pool,
    config.podDAI.faucet,
    testing.podManager.address
  );

  testing.pod = await ethers.getContractAt(
    "Pod",
    testing.pod_and_tokendrop_static[0]
  );

  testing.tokenDrop = await ethers.getContractAt(
    "TokenDrop",
    testing.pod_and_tokendrop_static[1]
  );

  testing.drop = await ethers.getContractAt("TokenDrop", testing.pod.drop());

  return testing.pod_and_tokendrop_static;
};

module.exports = {
  createPodAndTokenDrop,
  setupContractFactories,
  createPeripheryContract,
  setupSigners,
};
