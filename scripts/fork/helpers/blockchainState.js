const {ethers} = require('hardhat')

async function userDetails(pod, token, ticket, decimals) {

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

  const userOne = {
    account: '0x0000000000000000000000000000000000000001',
    tokens: ethers.utils.formatUnits(accountPrimaryBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountPrimaryBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountPrimaryBalanceOfPod, decimals),
  }
  const userTwo = {
    account: '0x0000000000000000000000000000000000000002',
    tokens: ethers.utils.formatUnits(accountSecondaryBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountSecondaryBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountSecondaryBalanceOfPod, decimals),
  }
  const userAdmin = {
    account: '0x0000000000000000000000000000000000000003',
    tokens: ethers.utils.formatUnits(accountAdminBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(accountAdminBalanceOfTicket, decimals),
    shares: ethers.utils.formatUnits(accountAdminBalanceOfPod, decimals),
  }
  const podDetails = {
    account: `${pod.address} (Pod)`,
    tokens: ethers.utils.formatUnits(podBalanceOfToken, decimals),
    tickets: ethers.utils.formatUnits(podBalanceOfTicket, decimals),
    shares: '0',
  }

  console.table([
    userOne, 
    userTwo, 
    userAdmin, 
    podDetails
  ])

}

module.exports = { 
  userDetails
}