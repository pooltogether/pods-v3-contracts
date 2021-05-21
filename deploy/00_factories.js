const { constants } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(deployer, "deployer");

  const tokenDropFactory = await deploy("TokenDropFactory", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("PodFactory", {
    from: deployer,
    args: [tokenDropFactory.address],
    log: true,
  });
};

module.exports.tags = ["Factories"];
