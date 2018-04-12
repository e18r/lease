let Logic = artifacts.require("./Logic.sol");
let Lease = artifacts.require("./Lease.sol");
let LeaseMock = artifacts.require("./LeaseMock.sol");

module.exports = (deployer) => {
    deployer.deploy(Logic);
    deployer.link(Logic, Lease);
    let owner = web3.eth.accounts[1];
    let tenant = web3.eth.accounts[2];
    let startDate = Math.round(Date.now() / 1000) + 1000;
    let fee = web3.toWei(1);
    let deposit = web3.toWei(2);
    deployer.deploy(Lease, owner, tenant, startDate, fee, deposit);
    deployer.link(Logic, LeaseMock);
    deployer.deploy(LeaseMock, owner, tenant, startDate, fee, deposit);
};
