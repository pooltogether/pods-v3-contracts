const {ethers, getNamedAccounts} = require('hardhat')
const { increaseTime } = require('../../../test/helpers/increaseTime')
const { dim, yellow, green, cyan } = require("../../../lib/chalk_colors");

async function acquirePrizePoolTicket(signer, prizePoolAddress, ticket, amount) {

  const prizePool = await ethers.getContractAt('PrizePool', prizePoolAddress, signer)
  await prizePool.depositTo(
    signer._address,
    amount,
    ticket,
    signer._address,
  )

}

async function userDetails(pod, token, ticket, decimals) {

  // green(`\n📈 Current Pod User Details`)


  // Token
  const accountPrimaryBalanceOfToken = await token.balanceOf('0x0000000000000000000000000000000000000001');
  const accountSecondaryBalanceOfToken = await token.balanceOf('0x0000000000000000000000000000000000000002');
  const accountAdminBalanceOfToken = await token.balanceOf('0x0000000000000000000000000000000000000003');
  const podBalanceOfToken = await token.balanceOf(pod.address);

  // Ticket
  const accountPrimaryBalanceOfTicket = await ticket.balanceOf('0x0000000000000000000000000000000000000001');
  const accountSecondaryBalanceOfTicket = await ticket.balanceOf('0x0000000000000000000000000000000000000002');
  const accountAdminBalanceOfTicket = await ticket.balanceOf('0x0000000000000000000000000000000000000003');
  const podBalanceOfTicket = await ticket.balanceOf(pod.address);

  // Shares
  const accountPrimaryBalanceOfPod = await pod.balanceOf('0x0000000000000000000000000000000000000001');
  const accountSecondaryBalanceOfPod = await pod.balanceOf('0x0000000000000000000000000000000000000002');
  const accountAdminBalanceOfPod = await pod.balanceOf('0x0000000000000000000000000000000000000003');


  // Price per Share
  const accountPrimaryPricePerSharePod = await pod.getUserPricePerShare('0x0000000000000000000000000000000000000001');
  const accountSecondaryPricePerSharePod = await pod.getUserPricePerShare('0x0000000000000000000000000000000000000002');
  const accountAdminPricePerSharePod = await pod.getUserPricePerShare('0x0000000000000000000000000000000000000003');

  const userOne = {
    account: '0x0000000000000000000000000000000000000001',
    tokens: ethers.utils.formatUnits(accountPrimaryBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountPrimaryBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountPrimaryBalanceOfPod, decimals),
    pricePerShare: ethers.utils.formatUnits(accountPrimaryPricePerSharePod, decimals)
  }
  const userTwo = {
    account: '0x0000000000000000000000000000000000000002',
    tokens: ethers.utils.formatUnits(accountSecondaryBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountSecondaryBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountSecondaryBalanceOfPod, decimals),
    pricePerShare: ethers.utils.formatUnits(accountSecondaryPricePerSharePod, decimals)
  }
  const userAdmin = {
    account: '0x0000000000000000000000000000000000000003',
    tokens: ethers.utils.formatUnits(accountAdminBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountAdminBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountAdminBalanceOfPod, decimals),
    pricePerShare: ethers.utils.formatUnits(accountAdminPricePerSharePod, decimals)
  }
  const podDetails = {
    account: `${pod.address} (Pod)`,
    tokens: ethers.utils.formatUnits(podBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(podBalanceOfTicket, decimals),
    shares: '0',
    pricePerShare: '0'
  }

  console.table([
    userOne, 
    userTwo, 
    userAdmin, 
    podDetails
  ])

}

module.exports = { 
  acquirePrizePoolTicket,
  userDetails
}