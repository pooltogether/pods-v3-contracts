const hardhat = require("hardhat");
const { getPodAndDropAddress } = require("../../lib/deploy");
const { ethers } = hardhat;

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  provider = hardhat.ethers.provider;
  const { execute } = deployments;
  const { deployer, prizePoolDAI, prizePoolDAITicket, prizePoolDAIFaucet, prizePoolUSDC } = await getNamedAccounts();
  const chainId = await getChainId();

  // Check ChainID (Rinkeby)
  if (chainId == 4) {

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
    
    // const createUSDC = await execute(
    //   "PodFactory",
    //   {
    //     from: deployer,
    //   },
    //   "create",
    //   CONFIG.podUSDC.prizePool,
    //   CONFIG.podUSDC.ticket,
    //   CONFIG.podUSDC.faucet,
    //   deployer,
    //   6
    // );
    
    // const createBAT = await execute(
    //   "PodFactory",
    //   {
    //     from: deployer,
    //   },
    //   "create",
    //   CONFIG.podBAT.prizePool,
    //   CONFIG.podBAT.ticket,
    //   CONFIG.podBAT.faucet,
    //   deployer,
    //   18
    // );
   
    await getPodAndDropAddress(createDAI.transactionHash, deployments, "DAI");
    // await getPodAndDropAddress(createUSDC.transactionHash, deployments, "USDC");
    // await getPodAndDropAddress(createBAT.transactionHash, deployments, "BAT");
  }
};

module.exports.tags = ["Pods"];
