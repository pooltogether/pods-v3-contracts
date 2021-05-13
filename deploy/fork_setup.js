const { constants } = require("ethers");

const { dim, yellow, green, cyan } = require("../lib/chalk_colors");

function displayResult(name, result) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`)
  } else {
    green(`${name} deployed at ${result.address}`)
  }
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, deployments, getChainId, ethers } = hardhat
  const { deploy } = deployments;

  const harnessDisabled = !!process.env.DISABLE_HARNESS

  // 31337 is unit testing, 1337 is for coverage
  const chainId = parseInt(await getChainId(), 10)
  const isTestEnvironment = chainId === 31337 || chainId === 1337

  let {
    deployer,
    rng,
    admin,
    sablier,
    reserveRegistry,
    testnetCDai
  } = await getNamedAccounts()

  dim("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
  dim("PoolTogether Pod Contracts - Deploy Script")
  dim("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")

  cyan("\nDeploying ControlledTokenProxyFactory...")
  const controlledTokenProxyFactoryResult = await deploy("PodFactoy", {
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  displayResult('ControlledTokenProxyFactory', controlledTokenProxyFactoryResult)

  dim("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
  green("Contract Deployments Complete!")
  dim("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")
};

module.exports.tags = ["Factories"];
