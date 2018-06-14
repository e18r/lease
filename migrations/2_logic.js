let Logic = artifacts.require("./Logic.sol");

module.exports = (deployer) => {
  let gasPrice = 10000000000;  
  deployer.deploy(Logic, {gasPrice:gasPrice});
};
