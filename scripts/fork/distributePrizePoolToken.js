const chalk = require('chalk')
const hardhat = require('hardhat')
const { utils } = require('ethers');
const { ethers, getNamedAccounts } = hardhat

async function run() {
  console.log(chalk.dim(`Transfering ERC20 tokens to accounts....`))
  const { deployer, DAI, USDC, COMP, UNI, POOL } = await getNamedAccounts()

  const binance = await ethers.provider.getUncheckedSigner('0x564286362092D8e7936f0549571a803B203aAceD')
  const poolWallet = await ethers.provider.getUncheckedSigner('0x21950e281bde1714ffd1062ed17c56d4d8de2359')

  const recipients = {
    ['DAI Holder']: {
      account: '0x0000000000000000000000000000000000000001',
      token: DAI,
    },
    ['USDC Holder']: {
      account: '0x0000000000000000000000000000000000000001',
      token: USDC,
    },
    // ['COMP Holder']: {
    //   account: '0x0000000000000000000000000000000000000001',
    //   token: COMP,
    // },
    ['UNI Holder']: {
      account: '0x0000000000000000000000000000000000000001',
      token: UNI,
    },
    // ['POOL Holder']: {
    //   account: '0x0000000000000000000000000000000000000001',
    //   token: POOL,
    // },
  }

  const keys = Object.keys(recipients)
  for (var i = 0; i < keys.length; i++) {
    
    const name = keys[i]
    const recipient = recipients[name]
    
    // ERC20 Token

    if(recipient.token != POOL) {

      const token = await ethers.getContractAt('ERC20Upgradeable', recipient.token, binance)
      const decimals = await token.decimals()
      
      console.log(chalk.dim(`Transfering 10,000 tokens to ${name}...`))
      await token.transfer(recipient.account, utils.parseUnits('10000', decimals))
      console.log(chalk.dim(`Completed Transfering 10,000 tokens to ${name}...`))
    } else {

      const token = await ethers.getContractAt('ERC20Upgradeable', recipient.token, poolWallet)
      const decimals = await token.decimals()

      console.log(chalk.dim(`Transfering 10,000 tokens to ${name}...`))
      await token.transfer(recipient.account, utils.parseUnits('10000', decimals))
      console.log(chalk.dim(`Completed Transfering 10,000 tokens to ${name}...`))

    }

  }

  console.log(chalk.green(`Account Funding Complete!`))
}

run()