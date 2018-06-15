let Logic = artifacts.require("./Logic.sol");
let Lease = artifacts.require("./Lease.sol");
let LeaseMock = artifacts.require("./LeaseMock.sol");

module.exports = (deployer) => {

  let owner = web3.eth.accounts[1];
  let tenant = web3.eth.accounts[2];
  let start = Math.round(Date.now() / 1000) + 15*24*60*60;
  let fee = 1000;
  let deposit = 2000;
  let gasPrice = 10000000000;
  
  deployer.deploy(Logic, {gasPrice:gasPrice});
  deployer.link(Logic, [Lease, LeaseMock]);
  
  deployer.deploy(Lease, tenant, start, fee, deposit,
		  {from:owner, gasPrice:gasPrice});
  deployer.deploy(LeaseMock, tenant, start, fee, deposit,
		  {from:owner, gasPrice:gasPrice});

};
