const hardhat = require("hardhat");
const { ethers } = require("hardhat");

const getPodAndDropAddress = async (transactionHash, deployments, symbol) => {
  provider = hardhat.ethers.provider;
  try {
    const factory = await deployments.get("PodFactory");
    let receipt = await provider.getTransactionReceipt(transactionHash);
    // TokenDropFactory Instance
    TokenDropFactory = await ethers.getContractFactory(
      "PodFactory",
      factory.address
    );

    const events = TokenDropFactory.interface.parseLog(receipt.logs[3]);

    console.log(`${symbol} Pod:`, events.args[0]);
    console.log(`${symbol} TokenDrop:`, events.args[1]);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getPodAndDropAddress,
};
