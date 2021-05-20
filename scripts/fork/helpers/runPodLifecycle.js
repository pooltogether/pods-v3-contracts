const {ethers, getNamedAccounts} = require('hardhat')
const { increaseTime } = require('../../../test/helpers/increaseTime')
const { dim, yellow, green, cyan } = require("../../../lib/chalk_colors");

const { userDetails } = require("./blockchainState");

const ONE_DAY = 86400;
const SEVEN_DAYS = 604800;
const TWENTY_EIGHT_DAYS = 2419200;
const FIFITY_SIX_DAYS = 4838400;

async function runPodLifecycle(signer, podAddress) {
  const namedAccounts = await getNamedAccounts()
  const account = signer._address

  // Account Helpers
  const tokenHolderPrimary = await ethers.provider.getUncheckedSigner('0x0000000000000000000000000000000000000001')
  const tokenHolderSecondary = await ethers.provider.getUncheckedSigner('0x0000000000000000000000000000000000000002')
  const tokenHolderAdmin = await ethers.provider.getUncheckedSigner('0x0000000000000000000000000000000000000003')


  yellow(`Pod Depositor: ${account}`)

  // Initialize Pod Contracts
  let pod = await ethers.getContractAt('Pod', podAddress, signer)
  
  // Pod Constants
  const tokenAddress = await pod.token()
  const ticketAddress = await pod.ticket()
  const prizePoolAddress = await pod.prizePool()
  const tokenDropAddress = await pod.tokenDrop()

  green(`Token Address: ${tokenAddress}`)
  green(`PrizePool Address: ${prizePoolAddress}`)
  green(`TokenDrop Address: ${tokenDropAddress}`)
  
  let pool = await ethers.getContractAt('ERC20Upgradeable', namedAccounts.POOL, signer)
  let token = await ethers.getContractAt('ERC20Upgradeable', tokenAddress, signer)
  let ticket = await ethers.getContractAt('ERC20Upgradeable', ticketAddress, signer)
  let prizePool = await ethers.getContractAt('PrizePool', prizePoolAddress, signer)
  let tokenDrop = await ethers.getContractAt('TokenDrop', tokenDropAddress, signer)
  
  // PrizePool Constants
  const prizeStrategyAddress = await prizePool.prizeStrategy()
  green(`PrizeStrategy Address: ${prizeStrategyAddress}`)
  const prizeStrategy = await ethers.getContractAt('MultipleWinners', prizeStrategyAddress, signer)
  
  // PrizeStrategy Constants
  const tokenListenerAddress = await prizeStrategy.tokenListener()
  green(`TokenListener Address: ${tokenListenerAddress}`)
  const tokenListener = await ethers.getContractAt('@pooltogether/pooltogether-contracts/contracts/token-faucet/TokenFaucet.sol:TokenFaucet', tokenListenerAddress, signer)
  
  // Token Constants
  const decimals = await token.decimals()
  const tokenName = await token.name()
  const tokenSymbol = await token.symbol()
  const balanceOfSigner = await token.balanceOf(signer._address)
  
  yellow(`Testing ${tokenName} (${tokenSymbol}) with ${decimals} using ${prizePoolAddress} PrizePool and ${podAddress} Pod `)
  cyan(`User starting token balance: ${ethers.utils.formatUnits(balanceOfSigner, decimals)}`)
  
  
  const depositAmount = ethers.utils.parseUnits('1000', decimals)
  const withdrawSharesAmount = ethers.utils.parseUnits('1000', decimals)

  /* --- Token Setup --- */
  await token.approve(podAddress, balanceOfSigner)
  cyan(`Approved total balance for deposit into Pod`)
  
  /* --- Pod Deposit (No Batch) --- */
  await pod.depositTo(account, depositAmount)
  cyan(`Executed depositTo - Depositing 1,000 tokens into the Pod`)
  
  /* --- Pod Confirm Balance (Before Withdraw) --- */
  const accountShareBalanceBeforeWithdraw = await pod.balanceOf(account)
  cyan(`Account Shares: ${ethers.utils.formatUnits(accountShareBalanceBeforeWithdraw, decimals)} (Expected to be 1,000)`)
  
  /* --- Pod Withdraw (No Penalty) --- */
  await pod.withdraw(withdrawSharesAmount, 0)
  cyan(`Executed withdraw - Buring shares and receiving collateral`)

  /* --- Pod Confirm Balance (After Withdraw) --- */
  const accountShareBalanceAfterWithdraw = await pod.balanceOf(account)
  cyan(`Account Shares: ${accountShareBalanceAfterWithdraw} (Expected to be 0)`)

  /* ------------------------------ */
  // Pod Execute Batch after Deposits
  /* ------------------------------ */

  /* --- Pod Deposit (Expecting Batch) --- */
  await pod.depositTo(account, depositAmount)
  cyan(`Executed depositTo - Depositing 1,000 tokens into the Pod`)

  /* --- Pod Drop --- */
  await pod.drop()
  cyan(`Executed batch - Moving deposits from Pod to PrizePool`)

  const accountShareBalancePostDrop = await pod.balanceOf(account)
  cyan(`Account Shares: ${accountShareBalancePostDrop} (Expected to be 0)`)

  cyan(`Calculating exit fees on 1,000 DAI after 0 days`)
  
  /* --- Pod Calculate Early Exit Fee (0 Days) --- */
  const getEarlyExitFee0Days = await pod.callStatic.getEarlyExitFee(accountShareBalancePostDrop)
  yellow(`0 Days Early Exit Fee: ${ethers.utils.formatUnits(getEarlyExitFee0Days, decimals)}`)

  // Fast Forward - 1 Week
  green(`Increasing time by 1 weeks (7 days)...`)
  increaseTime(SEVEN_DAYS)

  cyan(`Calculating exit fees on 1,000 DAI after 7 days`)

  /* --- Pod Calculate Early Exit Fee (7 Days) --- */
  const getEarlyExitFee7Days = await pod.callStatic.getEarlyExitFee(accountShareBalancePostDrop)
  yellow(`7 Days Early Exit Fee: ${ethers.utils.formatUnits(getEarlyExitFee7Days, decimals)}`)
  
  cyan(`Calculating Pod/USER POOL rewards`)

  /* --- Pod Calculate POOL Reward --- */
  const claimPodReward7Days = await tokenListener.callStatic.claim(podAddress)
  yellow(`Pod POOL claimable rewards: ${ethers.utils.formatUnits(claimPodReward7Days, 18)}`)
  
  /* --- Pod Calculate POOL Reward --- */
  const claimPodUserReward7Days = await tokenDrop.callStatic.claim(account)
  yellow(`User User Claimable Rewards: ${ethers.utils.formatUnits(claimPodUserReward7Days, 18)}`)

  /* ----------------------------------- */
  // Pod & User Claim Rewards after 7 Days
  /* ----------------------------------- */

  /* --- Pod Calculate POOL Reward --- */
  cyan(`Claiming Pod POOL rewards (after 7 days)...`)
  await pod.drop()
  const claimedPodReward7Days = await pool.balanceOf(tokenDropAddress)
  yellow(`Pod POOL claimed rewards: ${ethers.utils.formatUnits(claimedPodReward7Days, 18)}`)
  
  /* --- User Calculate POOL Reward --- */
  cyan(`Claiming user POOL rewards (after 7 days)...`)
  await tokenDrop.claim(account)
  const claimedPodUserReward7Days = await pool.balanceOf(account)
  yellow(`User POOL claimed rewards: ${ethers.utils.formatUnits(claimedPodUserReward7Days, 18)}`)

  /* --------------------------------------- */
  // Second Account Deposit
  /* --------------------------------------- */
  green(`🧝 Simulating Secondary Account Interactions`)

  // Initialize Pod Contracts
  pod = pod.connect(tokenHolderSecondary)
  token = token.connect(tokenHolderSecondary)

  const depositAmountSecondary = ethers.utils.parseUnits('500', decimals)

  /* --- Token Setup --- */
  await token.approve(podAddress, depositAmountSecondary)
  cyan(`Secondary User approved 500 for deposit into Pod`)
  
  let userSecondaryBalanceBeforeDeposit = await token.balanceOf(tokenHolderSecondary._address)
  yellow(`User token balance before deposit: ${ethers.utils.formatUnits(userSecondaryBalanceBeforeDeposit, 18)}`)
  
  /* --- Pod Deposit (No Batch) --- */
  await pod.depositTo(tokenHolderSecondary._address, depositAmountSecondary)
  cyan(`Executed depositTo - Secondary User depositing 500 tokens into the Pod`)
  
  let userSecondaryBalanceAfterDeposit = await token.balanceOf(tokenHolderSecondary._address)
  yellow(`User token balance before deposit: ${ethers.utils.formatUnits(userSecondaryBalanceAfterDeposit, 18)}`)

  // Display Current User Details
  await userDetails(pod, token, ticket, decimals)

  /* ----------------------------------- */
  // Pod & User Claim Rewards after 35 Days
  /* ----------------------------------- */
  pod = pod.connect(tokenHolderPrimary)

  // Fast Forward - 4 Week
  green(`Increasing time by 4 weeks (28 days)...`)
  increaseTime(TWENTY_EIGHT_DAYS)

  /* --- Pod Calculate POOL Reward --- */
  cyan(`Claiming Pod POOL rewards (after 35 days)...`)
  await pod.drop()
  const claimedPodReward28Days = await pool.balanceOf(tokenDropAddress)
  yellow(`Pod POOL claimed rewards: ${ethers.utils.formatUnits(claimedPodReward28Days, 18)}`)
  
  /* --- User Calculate POOL Reward --- */
  cyan(`Claiming user POOL rewards (after 35 days)...`)
  await tokenDrop.claim(tokenHolderPrimary._address)
  const claimedPodUserReward28Days = await pool.balanceOf(tokenHolderPrimary._address)
  yellow(`User POOL claimed rewards: ${ethers.utils.formatUnits(claimedPodUserReward28Days, 18)}`)
  
  /* --------------------------------------- */
  // Pod Simulate Winning using ptTokens
  /* --------------------------------------- */
  const prizePoolDirectDepositAmount = ethers.utils.parseUnits('5000', decimals)
  
  green(`\n ----- 🎟️  Deposit 5,000 PrizePool Tickets into Pod to simulate Pod Winning -----`)
  token = token.connect(tokenHolderAdmin)
  ticket = ticket.connect(tokenHolderAdmin)
  prizePool = prizePool.connect(tokenHolderAdmin)
  
  await token.approve(prizePoolAddress, prizePoolDirectDepositAmount)

  const PricePerShareBeforeWinning = await pod.getPricePerShare()
  yellow(`PricePerShare before winning: ${ethers.utils.formatUnits(PricePerShareBeforeWinning, decimals)}`)
  
  await prizePool.depositTo(
    podAddress,
    ethers.utils.parseUnits('1300', 18),
    ticketAddress,
    podAddress,
    )
  
  // Display Current User Details
  await userDetails(pod, token, ticket, decimals)
  
  const PricePerShareAfterWinning = await pod.getPricePerShare()
  yellow(`PricePerShare after winning: ${ethers.utils.formatUnits(PricePerShareAfterWinning, decimals)}`)

  // // Fast Forward - 1 Week
  // green(`Increasing time by 1 day...`)
  // increaseTime(ONE_DAY)
  
  /* --------------------------------------- */
  // Pod Burn Shares and Withdraw Collateral
  /* --------------------------------------- */
  cyan(`Burning shares and withdrawing deposited collateral (after 35 days)...`)
  
  /* --- User 1 Withdraw --- */
  green(`\n---- 🧝 User 1 Withdraw ---- \n`)
  pod = pod.connect(tokenHolderPrimary)
  
  let acount1Balance = await pod.balanceOf(tokenHolderPrimary._address)
  let acount1BalanceOfUnderlying = await pod.balanceOfUnderlying(tokenHolderPrimary._address)
  const acount1EarlyExitFee = await pod.callStatic.getEarlyExitFee(acount1BalanceOfUnderlying)
  green(`User 1 Balance: ${ethers.utils.formatUnits(acount1Balance, decimals)}`)
  green(`User 1 Balance Underlying: ${ethers.utils.formatUnits(acount1BalanceOfUnderlying, decimals)}`)
  green(`User 1 Exit Fee: ${ethers.utils.formatUnits(acount1EarlyExitFee, decimals)}`)
  
  await pod.withdraw(acount1Balance, acount1EarlyExitFee)

  /* --- User 2 Withdraw --- */
  green(`\n---- 🧝 User 2 Withdraw ---- \n`)
  pod = pod.connect(tokenHolderSecondary)

  let acount2Balance = await pod.balanceOf(tokenHolderSecondary._address)
  let acount2BalanceOfUnderlying = await pod.balanceOfUnderlying(tokenHolderSecondary._address)
  let acount2EarlyExitFee = await pod.callStatic.getEarlyExitFee(acount2BalanceOfUnderlying)
  green(`User 2 Balance: ${ethers.utils.formatUnits(acount2Balance, decimals)}`)
  green(`User 2 Balance Underlying: ${ethers.utils.formatUnits(acount2BalanceOfUnderlying, decimals)}`)
  green(`User 2 Exit Fee: ${ethers.utils.formatUnits(acount2EarlyExitFee, decimals)}`)

  await pod.withdraw(acount2Balance, acount2EarlyExitFee)

  green(`\n---- Empty Pod Data and Figures -----`)

  const podTotalSupply  = await pod.totalSupply()
  green(`Pod Total Supply: ${ethers.utils.formatUnits(podTotalSupply, decimals)}`)

  const podExitFee  = await prizePool.callStatic.calculateEarlyExitFee(podAddress, ticketAddress, podTotalSupply)
  green(`Pod Exit Fee: ${ethers.utils.formatUnits(podExitFee[0], decimals)}`)
  
  // Display Current User Details
  await userDetails(pod, token, ticket, decimals)

}

module.exports = {
  runPodLifecycle,
}