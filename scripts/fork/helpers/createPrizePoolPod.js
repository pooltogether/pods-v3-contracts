const { ethers } = require('hardhat')
const { getPodAndDropAddress } = require("../../../lib/deploy");
const { dim, yellow, green, cyan } = require("../../../lib/chalk_colors");

const { 
  getPrizePoolAddressFromBuilderTransaction,
  runPoolLifecycle
} = require('../helpers/runPoolLifecycle')


async function createPrizePoolPod(signer, prizePoolAddress) {
  const podFactory = await ethers.getContract('PodFactory', signer)
  const prizePool = await ethers.getContractAt('PrizePool', prizePoolAddress)

  dim(`Using PodFactory @ ${podFactory.address}`)

  const block = await ethers.provider.getBlock()

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
  console.log(address, 'address')

  const tx = await podFactory.create(
    prizePoolAddress,
    tokens[1],
    faucetAddress,
    prizeStrategyAddress,
    18
  )

  green(`Created PrizePool Pod ${address[0]}`)

}

module.exports = {
  createPrizePoolPod
}