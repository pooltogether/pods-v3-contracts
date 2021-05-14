const {ethers, getNamedAccounts} = require('hardhat')
const { increaseTime } = require('../../../test/helpers/increaseTime')
const { dim, yellow, green, cyan } = require("../../../lib/chalk_colors");


const ONE_DAY = 86400;
const SEVEN_DAYS = 604800;
const TWENTY_EIGHT_DAYS = 2419200;
const FIFITY_SIX_DAYS = 4838400;

async function runPodLifecycle(signer, podAddress) {
  const namedAccounts = await getNamedAccounts()
  const account = signer._address
  yellow(`Pod Depositor: ${account}`)

  // Initialize Pod Contracts
  const pod = await ethers.getContractAt('Pod', podAddress, signer)
  
  // Pod Constants
  const tokenAddress = await pod.token()
  const prizePoolAddress = await pod.prizePool()
  const tokenDropAddress = await pod.tokenDrop()

  green(`Token Address: ${tokenAddress}`)
  green(`PrizePool Address: ${prizePoolAddress}`)
  green(`TokenDrop Address: ${tokenDropAddress}`)
  
  const pool = await ethers.getContractAt('ERC20Upgradeable', namedAccounts.POOL, signer)
  const token = await ethers.getContractAt('ERC20Upgradeable', tokenAddress, signer)
  const prizePool = await ethers.getContractAt('PrizePool', prizePoolAddress, signer)
  const tokenDrop = await ethers.getContractAt('TokenDrop', tokenDropAddress, signer)
  
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

  /* ----------------------------------- */
  // Pod & User Claim Rewards after 35 Days
  /* ----------------------------------- */

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
  await tokenDrop.claim(account)
  const claimedPodUserReward28Days = await pool.balanceOf(account)
  yellow(`User POOL claimed rewards: ${ethers.utils.formatUnits(claimedPodUserReward28Days, 18)}`)


  /* --- Pod Calculate Early Exit Fee (35 Days) --- */
  cyan(`Calculating exit fees on 1,000 DAI after 35 days`)
  const getEarlyExitFee35Days = await pod.callStatic.getEarlyExitFee(accountShareBalancePostDrop)
  yellow(`35 Days Early Exit Fee: ${ethers.utils.formatUnits(getEarlyExitFee35Days, decimals)}`)

  /* --------------------------------------- */
  // Pod Burn Shares and Withdraw Collateral
  /* --------------------------------------- */
  cyan(`Burning shares and withdrawing deposited collateral (after 35 days)...`)
  
  const tokenBalanceBeforeWithdraw = await token.balanceOf(account)
  yellow(`User Token balance before withdraw: ${ethers.utils.formatUnits(tokenBalanceBeforeWithdraw, decimals)}`)
  
  await pod.withdraw(withdrawSharesAmount, 0)
  
  const tokenBalanceAfterWithdraw = await token.balanceOf(account)
  yellow(`User Token after before withdraw: ${ethers.utils.formatUnits(tokenBalanceAfterWithdraw, decimals)}`)
}

module.exports = {
  runPodLifecycle,
}