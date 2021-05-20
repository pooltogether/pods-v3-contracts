const {ethers, getNamedAccounts} = require('hardhat')
const { createPrizePoolPod } = require('../helpers/createPrizePoolPod')

async function run() {
  const namedAccount = await getNamedAccounts()

  const daiHolder = await ethers.provider.getUncheckedSigner('0x0000000000000000000000000000000000000001')
  const prizePoolAddress = namedAccount.prizePoolUNI

  await createPrizePoolPod(daiHolder, prizePoolAddress)
}

run()
