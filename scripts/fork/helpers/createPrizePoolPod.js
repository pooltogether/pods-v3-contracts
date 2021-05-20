const { ethers } = require('hardhat')
const { getPodAndDropAddress } = require("../../../lib/deploy");
const { dim, yellow, green, cyan } = require("../../../lib/chalk_colors");

const { 
  runPodLifecycle,
} = require('../helpers/runPodLifecycle')


async function createPrizePoolPod(signer, prizePoolAddress) {
  const podFactory = await ethers.getContract('PodFactory', signer)
  const prizePool = await ethers.getContractAt('PrizePool', prizePoolAddress)

  dim(`Using PodFactory @ ${podFactory.address}`)

  const tokens = await prizePool.tokens()
  const prizeStrategyAddress = await prizePool.prizeStrategy()
  const prizeStrategy = await ethers.getContractAt('MultipleWinners', prizeStrategyAddress)
  const faucetAddress = await prizeStrategy.tokenListener()

  // Create Pod
  const address = await podFactory.callStatic.create(

    prizePoolAddress,
    tokens[1],
    faucetAddress,
    prizeStrategyAddress,
    18
  )
  await podFactory.create(
    prizePoolAddress,
    tokens[1],
    faucetAddress,
    prizeStrategyAddress,
    18
  )

  green(`Created PrizePool Pod ${address}`)
  runPodLifecycle(signer, address)
}

module.exports = {
  createPrizePoolPod
}