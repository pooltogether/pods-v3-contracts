function getConfig(networkOption) {
  return config.networks[networkOption ? networkOption : network.name];
}

function getContract(nameOrAddress, silent) {
  if (nameOrAddress.length === 42) {
    return nameOrAddress;
  }
  const config = getConfig("mainnet");
  if (config.contracts[nameOrAddress]) {
    return config.contracts[nameOrAddress];
  }

  if (silent) {
    return null;
  }
  throw new Error(`Can't find contract ${nameOrAddress}`);
}

function getToken(nameOrAddress, silent) {
  if (nameOrAddress.length === 42) {
    return nameOrAddress;
  }
  const config = getConfig("mainnet");
  if (config.tokens[nameOrAddress]) {
    return config.tokens[nameOrAddress];
  }

  if (silent) {
    return null;
  }
  throw new Error(`Can't find contract ${nameOrAddress}`);
}

function setDeployed(name, address, network) {
  const config = getConfig(network);
  config.deployed[name] = address;
}

async function deployContract(name, artifact, ...args) {
  const contract = await artifact.deploy(...args);
  await contract.deployed();
  const config = module.exports.getConfig("mainnet");
  config.contracts[name] = contract.address;
  console.log(`${name} deployed to ${contract.address}`);

  return contract;
}

function setContract(name, address) {
  const config = getConfig("mainnet");
  config.contracts[name] = address;
}
function setToken(name, address) {
  const config = getConfig("mainnet");
  config.tokens[name] = address;
}

module.exports = {
  getConfig,
  deployContract,
  getToken,
  getContract,
  setDeployed,
  setContract,
  setToken,
};
