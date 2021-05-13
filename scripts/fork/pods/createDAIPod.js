const {ethers} = require('hardhat')
const { createPrizePoolPod } = require('../helpers/createPrizePoolPod')
const { DAI_HOLDER } = require('../constants')

async function run() {
  const daiHolder = await ethers.provider.getUncheckedSigner(DAI_HOLDER)
  const daiPrizePoolAddress = '0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a'

  await createPrizePoolPod(daiHolder, daiPrizePoolAddress)
}

run()
