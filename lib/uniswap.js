const { getContract, setContract, getConfig, getToken } = require("./config");

/**
 * @name getFactory
 * @returns
 */
async function getFactory() {
  let factory = getContract("UniswapFactory", true);
  if (!factory) {
    const router = await getRouter();
    factory = await router.factory();
    setContract("UniswapFactory", factory);
  }

  const contract = await ethers.getContractAt(
    "contracts/mocks/uniswap/UniswapV2Router.sol:IUniswapV2Factory",
    factory
  );
  return contract;
}

/**
 * @name getRouter
 * @returns
 */
async function getRouter() {
  let router = getContract("MockUniswapRouter", true);
  if (!router) {
    const config = getConfig("mainnet");
    const MockUniswapRouter = await ethers.getContractFactory(
      "MockUniswapRouter"
    );
    const routerContract = await MockUniswapRouter.attach(
      config.contracts.UniswapRouter
    );
    setContract("MockUniswapRouter", routerContract.address);
    setContract("WETH", await routerContract.WETH());
    // console.log(config, "config");
    return routerContract;
  }

  const contract = await ethers.getContractAt("MockUniswapRouter", router);
  return contract;
}

/**
 * @name getPairAddress
 * @param {*} token1
 * @param {*} token2
 * @returns
 */
async function getPairAddress(token1, token2) {
  const factory = await getFactory();
  const pair = await factory.getPair(getContract(token1), getContract(token2));
  return pair;
}

/**
 * @name purchaseToken
 * @param {*} token1
 * @param {*} token2
 * @param {*} value1
 * @param {*} value2
 * @returns
 */
async function purchaseToken(
  token1,
  token2,
  amountIn,
  to,
  { UniswapRouter, exactAmount }
) {
  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    UniswapRouter
  );

  const amountOut = await router.getAmountsOut(amountIn, [token1, token2]);

  let swapped;
  if (exactAmount) {
    swapped = await router.swapETHForExactTokens(
      amountOut[1],
      [token1, token2],
      to,
      1647499488,
      {
        value: amountOut[0],
      }
    );
  } else {
    swapped = await router.swapExactETHForTokens(
      amountOut[1],
      [token1, token2],
      to,
      1647499488,
      {
        value: amountIn,
      }
    );
  }

  return swapped;
}

/**
 * @name createPair
 * @param {*} token1
 * @param {*} token2
 * @param {*} value1
 * @param {*} value2
 * @returns
 */
async function createPair(token1, token2, value1, value2) {
  const router = await getRouter();

  if (value1 && value2) {
    const [owner] = await ethers.getSigners();

    const token2Contract = await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      getToken(token2)
    );
    const txApprove2 = await token2Contract.approve(
      router.address,
      ethers.utils.parseEther(value2)
    );

    if (token1 === "ETH" && value1) {
      token1 = "WETH";

      await txApprove2.wait();

      const tx = await router.addLiquidityETH(
        getToken(token2),
        ethers.utils.parseEther(value2),
        ethers.utils.parseEther(value2),
        ethers.utils.parseEther(value1),
        owner.address,
        "1800000000",
        { value: ethers.utils.parseEther(value1) }
      );
      await tx.wait();
    } else {
      const token1Contract = await ethers.getContractAt(
        "contracts/interfaces/IERC20.sol:IERC20",
        getToken(token1)
      );
      const txApprove1 = await token1Contract.approve(
        router.address,
        ethers.utils.parseEther(value1)
      );
      await Promise.all([txApprove1.wait(), txApprove2.wait()]);

      const tx = await router.addLiquidity(
        getToken(token1),
        getToken(token2),
        ethers.utils.parseEther(value1),
        ethers.utils.parseEther(value1),
        ethers.utils.parseEther(value2),
        ethers.utils.parseEther(value2),
        owner.address,
        "1800000000"
      );
      await tx.wait();
    }
  } else {
    if (token1 === "ETH") {
      token1 = "WETH";
    }
    const factory = await getFactory();
    const tx = await factory.createPair(getToken(token1), getToken(token2));
    await tx.wait();
  }

  const address = await getPairAddress(getToken(token1), getToken(token2));
  if (value1 && value2) {
    console.log(
      `Created Uniswap pair at ${address} with ${value1} ${token1} & ${value2} ${token2}`
    );
  } else {
    console.log(`Created Uniswap pair at ${address} for ${token1} & ${token2}`);
  }
  return address;
}

module.exports = {
  getPairAddress,
  createPair,
  purchaseToken,
  getRouter,
};
