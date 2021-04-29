const hardhat = require("hardhat");
const { getConfig } = require("../../lib/config");
const { getPodAndDropAddress } = require("../../lib/deploy");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  provider = hardhat.ethers.provider;
  const { execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Mainnet or MainnetFork)
  if (chainId == 1 || chainId == 1337) {
    const CONFIG = getConfig("mainnet");

    // Create DAI Pod
    const createDAI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podDAI.prizePool,
      CONFIG.podDAI.ticket,
      CONFIG.tokens.POOL,
      CONFIG.podDAI.faucet,
      deployer
    );

    await getPodAndDropAddress(createDAI.transactionHash, deployments, "DAI");

    const createUSDC = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podUSDC.prizePool,
      CONFIG.podUSDC.ticket,
      CONFIG.tokens.POOL,
      CONFIG.podUSDC.faucet,
      deployer
    );

    await getPodAndDropAddress(createUSDC.transactionHash, deployments, "USDC");

    const createUNI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podUNI.prizePool,
      CONFIG.podUNI.ticket,
      CONFIG.tokens.POOL,
      CONFIG.podUNI.faucet,
      deployer
    );

    await getPodAndDropAddress(createUNI.transactionHash, deployments, "UNI");

    const createCOMP = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podCOMP.prizePool,
      CONFIG.podCOMP.ticket,
      CONFIG.tokens.POOL,
      CONFIG.podCOMP.faucet,
      deployer
    );

    await getPodAndDropAddress(createCOMP.transactionHash, deployments, "COMP");
  }
};

module.exports.tags = ["Factories"];
