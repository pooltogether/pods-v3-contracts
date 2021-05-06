const hardhat = require("hardhat");
const { getConfig } = require("../../lib/config");
const { getPodAndDropAddress } = require("../../lib/deploy");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  provider = hardhat.ethers.provider;
  const { execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Rinkeby)
  console.log(chainId, 'chainId')
  if (chainId == 4) {
    const CONFIG = getConfig("rinkeby");

    // Create DAI Pod
    const createDAI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podDAI.prizePool,
      CONFIG.podDAI.ticket,
      '0xdD1cba915Be9c7a1e60c4B99DADE1FC49F67f80D', // test token
      CONFIG.podDAI.faucet,
      deployer
    );

    await getPodAndDropAddress(createDAI.transactionHash, deployments, "rDAI");
  }
};

module.exports.tags = ["Factories"];
