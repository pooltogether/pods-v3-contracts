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

  if(isTestEnvironment) {

    dim("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    dim("PoolTogether Contracts - Deploy Script")
    dim("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")

    cyan("\nDeploying ControlledTokenProxyFactory...")
    const controlledTokenProxyFactoryResult = await deploy("ControlledTokenProxyFactory", {
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    displayResult('ControlledTokenProxyFactory', controlledTokenProxyFactoryResult)

    let multipleWinnersProxyFactoryResult
    cyan("\nDeploying MultipleWinnersProxyFactory...")
    if (isTestEnvironment && !harnessDisabled) {
      multipleWinnersProxyFactoryResult = await deploy("MultipleWinnersProxyFactory", {
        contract: 'MultipleWinnersHarnessProxyFactory',
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    } else {
      multipleWinnersProxyFactoryResult = await deploy("MultipleWinnersProxyFactory", {
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    }
    displayResult('MultipleWinnersProxyFactory', multipleWinnersProxyFactoryResult)

    cyan("\nDeploying CompoundPrizePoolProxyFactory...")
    let compoundPrizePoolProxyFactoryResult
    if (isTestEnvironment && !harnessDisabled) {
      compoundPrizePoolProxyFactoryResult = await deploy("CompoundPrizePoolProxyFactory", {
        contract: 'CompoundPrizePoolHarnessProxyFactory',
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    } else {
      compoundPrizePoolProxyFactoryResult = await deploy("CompoundPrizePoolProxyFactory", {
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    }
    displayResult('CompoundPrizePoolProxyFactory', compoundPrizePoolProxyFactoryResult)

    cyan("\nDeploying YieldSourcePrizePoolProxyFactory...")
    let yieldSourcePrizePoolProxyFactoryResult
    if (isTestEnvironment && !harnessDisabled) {
      yieldSourcePrizePoolProxyFactoryResult = await deploy("YieldSourcePrizePoolProxyFactory", {
        contract: 'YieldSourcePrizePoolHarnessProxyFactory',
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    } else {
      yieldSourcePrizePoolProxyFactoryResult = await deploy("YieldSourcePrizePoolProxyFactory", {
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    }
    displayResult('YieldSourcePrizePoolProxyFactory', yieldSourcePrizePoolProxyFactoryResult)

    cyan("\nDeploying TicketProxyFactory...")
    const ticketProxyFactoryResult = await deploy("TicketProxyFactory", {
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    displayResult('TicketProxyFactory', ticketProxyFactoryResult)
    
    let stakePrizePoolProxyFactoryResult
    if (isTestEnvironment && !harnessDisabled) {
      cyan("\nDeploying StakePrizePoolHarnessProxyFactory...")
      stakePrizePoolProxyFactoryResult = await deploy("StakePrizePoolProxyFactory", {
        contract: 'StakePrizePoolHarnessProxyFactory',
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    }
    else{
      cyan("\nDeploying StakePrizePoolProxyFactory...")
      stakePrizePoolProxyFactoryResult = await deploy("StakePrizePoolProxyFactory", {
        from: deployer,
        skipIfAlreadyDeployed: true
      })
    }
    displayResult('StakePrizePoolProxyFactory', stakePrizePoolProxyFactoryResult)

    cyan("\nDeploying ControlledTokenBuilder...")
    const controlledTokenBuilderResult = await deploy("ControlledTokenBuilder", {
      args: [
        controlledTokenProxyFactoryResult.address,
        ticketProxyFactoryResult.address
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    displayResult('ControlledTokenBuilder', controlledTokenBuilderResult)

    cyan("\nDeploying MultipleWinnersBuilder...")
    const multipleWinnersBuilderResult = await deploy("MultipleWinnersBuilder", {
      args: [
        multipleWinnersProxyFactoryResult.address,
        controlledTokenBuilderResult.address,
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    displayResult('MultipleWinnersBuilder', multipleWinnersBuilderResult)

    cyan("\nDeploying PoolWithMultipleWinnersBuilder...")
    const poolWithMultipleWinnersBuilderResult = await deploy("PoolWithMultipleWinnersBuilder", {
      args: [
        reserveRegistry,
        compoundPrizePoolProxyFactoryResult.address,
        yieldSourcePrizePoolProxyFactoryResult.address,
        stakePrizePoolProxyFactoryResult.address,
        multipleWinnersBuilderResult.address
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    displayResult('PoolWithMultipleWinnersBuilder', poolWithMultipleWinnersBuilderResult)

    dim("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    green("Contract Deployments Complete!")
    dim("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")
  }
};

module.exports.tags = ["Factories"];
