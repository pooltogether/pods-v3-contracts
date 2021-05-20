const hardhat = require("hardhat");
const { getPodAndDropAddress } = require("../../lib/deploy");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  provider = hardhat.ethers.provider;
  const { execute } = deployments;

  const {
    deployer,
    prizePoolDAI,
    prizePoolDAITicket,
    prizePoolDAIFaucet,
    prizePoolUSDC,
    prizePoolUSDCTicket,
    prizePoolUSDCFaucet,
    prizePoolCOMP,
    prizePoolCOMPTicket,
    prizePoolCOMPFaucet,
    prizePoolUNI,
    prizePoolUNITicket,
    prizePoolUNIFaucet,
    prizePoolPOOL,
    prizePoolPOOLTicket,
    prizePoolPOOLFaucet,
  } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Mainnet or MainnetFork)
  if (chainId == 1 || chainId == 1337) {
    // Create DAI Pod
    const createDAI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      prizePoolDAI,
      prizePoolDAITicket,
      prizePoolDAIFaucet,
      deployer,
      18
    );

    const createUSDC = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      prizePoolUSDC,
      prizePoolUSDCTicket,
      prizePoolUSDCFaucet,
      deployer,
      6
    );

    const createUNI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      prizePoolUNI,
      prizePoolUNITicket,
      prizePoolUNIFaucet,
      deployer,
      18
    );

    const createCOMP = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      prizePoolCOMP,
      prizePoolCOMPTicket,
      prizePoolCOMPFaucet,
      deployer,
      18
    );

    const createPOOL = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      prizePoolPOOL,
      prizePoolPOOLTicket,
      prizePoolPOOLFaucet,
      deployer,
      18
    );

    await getPodAndDropAddress(createDAI.transactionHash, deployments, "DAI");
    await getPodAndDropAddress(createUSDC.transactionHash, deployments, "USDC");
    await getPodAndDropAddress(createUNI.transactionHash, deployments, "UNI");
    await getPodAndDropAddress(createCOMP.transactionHash, deployments, "COMP");
    await getPodAndDropAddress(createPOOL.transactionHash, deployments, "POOL");
  }
};

module.exports.tags = ["Pods"];
