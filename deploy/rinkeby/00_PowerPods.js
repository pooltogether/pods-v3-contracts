const hardhat = require("hardhat");
const { getConfig } = require("../../lib/config");
const { getPodAndDropAddress } = require("../../lib/deploy");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  provider = hardhat.ethers.provider;
  const { execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Rinkeby)
  if (chainId == 4) {
    const CONFIG = getConfig("rinkeby");

    const createDAI = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podDAI.prizePool,
      CONFIG.podDAI.ticket,
      CONFIG.podDAI.faucet,
      deployer,
      18
    );
    
    const createUSDC = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podUSDC.prizePool,
      CONFIG.podUSDC.ticket,
      CONFIG.podUSDC.faucet,
      deployer,
      6
    );
    
    const createBAT = await execute(
      "PodFactory",
      {
        from: deployer,
      },
      "create",
      CONFIG.podBAT.prizePool,
      CONFIG.podBAT.ticket,
      CONFIG.podBAT.faucet,
      deployer,
      18
    );
   
    await getPodAndDropAddress(createDAI.transactionHash, deployments, "DAI");
    await getPodAndDropAddress(createUSDC.transactionHash, deployments, "USDC");
    await getPodAndDropAddress(createBAT.transactionHash, deployments, "BAT");
  }
};

module.exports.tags = ["Pods"];
