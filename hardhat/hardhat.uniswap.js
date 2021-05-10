const { utils } = require("ethers");
const { purchaseToken } = require("../lib/uniswap");

/**
 * @name purchase-token
 */
task("purchase-token")
  .addPositionalParam("token0")
  .addPositionalParam("token1")
  .addPositionalParam("amount")
  .addPositionalParam("to")
  .setAction(async function ({ token0, token1, amount, to }) {
    try {
      await purchaseToken(token0, token1, utils.parseEther(amount), to, {
        UniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        exactAmount: true,
      });
    } catch (error) {
      console.log(error);
    }
  });
