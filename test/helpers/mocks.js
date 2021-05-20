
/* --- Global Modules --- */
const { deployMockContract } = require("@ethereum-waffle/mock-contract")

/* --- Local Modules --- */
const ERC20_Interface = require("../../artifacts/contracts/interfaces/IERC20.sol/IERC20.json")
const ERC20Safe_Interface = require("../../artifacts/@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol/SafeERC20Upgradeable.json")
const PrizePool_Interface = require("../../artifacts/contracts/interfaces/IPrizePool.sol/IPrizePool.json")
const TokenFaucet_Interface = require("../../artifacts/contracts/interfaces/TokenFaucet.sol/TokenFaucet.json")
const PrizeStrategy_Interface = require("../../artifacts/contracts/interfaces/IPrizeStrategyMinimal.sol/IPrizeStrategyMinimal.json")

let overrides = { gasLimit: 9500000 }

/**
 * @name mockERC20
 * @param {Object} wallet 
 */
async function mockERC20(wallet) {
  return deployMockContract(wallet, ERC20_Interface.abi, overrides)
}

/**
 * @name mockSafeERC20
 * @param {Object} wallet 
 */
async function mockSafeERC20(wallet) {
  return deployMockContract(wallet, ERC20Safe_Interface.abi, overrides)
}

/**
 * @name mockERC20InitializeBasics
 * @param {Object} wallet 
 */
 async function mockERC20InitializeBasics(mockedContract, configuraton) {
  await mockedContract.mock.name.returns(configuraton.name)
  await mockedContract.mock.symbol.returns(configuraton.symbol)
  return mockedContract
}



/**
 * @name mockPrizePool
 * @param {Object} wallet 
 */
 async function mockPrizePool(wallet) {
  return deployMockContract(wallet, PrizePool_Interface.abi, overrides)
}

/**
 * @name mockPrizePoolInitializeBasics
 * @param {Object} wallet 
 */
 async function mockPrizePoolInitializeBasics(mockedContract, configuraton) {
  await mockedContract.mock.token.returns(configuraton.token)

  return mockedContract
}

/**
 * @name mockTokenFaucet
 * @param {Object} wallet 
 */
 async function mockTokenFaucet(wallet) {
  return deployMockContract(wallet, TokenFaucet_Interface.abi, overrides)
}

/**
 * @name mockTokenFaucetInitializeBasics
 * @param {Object} wallet 
 */
 async function mockTokenFaucetInitializeBasics(mockedContract, configuraton) {
  await mockedContract.mock.asset.returns(configuraton.asset) 
  await mockedContract.mock.measure.returns(configuraton.asset)

  return mockedContract
}

/**
 * @name mockPrizeStrategy
 * @param {Object} wallet 
 */
 async function mockPrizeStrategy(wallet) {
  return deployMockContract(wallet, PrizeStrategy_Interface.abi, overrides)
}

module.exports = {
  mockERC20,
  mockERC20InitializeBasics,
  mockSafeERC20,
  mockPrizePool,
  mockPrizePoolInitializeBasics,
  mockTokenFaucet,
  mockTokenFaucetInitializeBasics,
  mockPrizeStrategy
}