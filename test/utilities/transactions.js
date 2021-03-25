const isTransactionMined = async (transactionHash) => {
  const txReceipt = await provider.getTransactionReceipt(transactionHash);
  if (txReceipt && txReceipt.blockNumber) {
    return txReceipt;
  }
};

module.exports = {
  isTransactionMined,
};
