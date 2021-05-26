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
  } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Rinkeby)
  if (chainId == 4) {
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

    await getPodAndDropAddress(createDAI.transactionHash, deployments, "DAI");
    await getPodAndDropAddress(createUSDC.transactionHash, deployments, "USDC");
  }
};

module.exports.tags = ["Pods"];
