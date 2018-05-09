const helper = require("./helper.js");
const OWNER = helper.OWNER;
const TENANT = helper.TENANT;
const ROBBER = helper.ROBBER;
const now = helper.now;
const days = helper.days;
const months = helper.months;
const gasPrice = helper.gasPrice;

const Logic = artifacts.require("./Logic.sol");
const Lease = artifacts.require("./LeaseMock.sol");

async function fnGas(from, fn) {
    let params = Object.values(arguments).slice(2);
    params.push({from:from, gasPrice:gasPrice});
    let balance0 = web3.eth.getBalance(from);
    await fn.apply(this, params);
    let balance1 = web3.eth.getBalance(from);
    let txFee = balance0 - balance1;
    let gasUsed = Math.round(txFee / gasPrice);
    console.log(gasUsed);
}

function txGas(from, to, value) {
    let balance0 = web3.eth.getBalance(from);
    web3.eth.sendTransaction({from:from, to:to, value:value,
			      gasPrice:gasPrice});
    let balance1 = web3.eth.getBalance(from);
    let txFee = balance0 - balance1 + value;
    let gasUsed = Math.round(txFee / gasPrice);
    console.log(gasUsed);
}

contract("Comparison", async (accounts) => {

    it("transaction", async () => {
	txGas(accounts[ROBBER], accounts[OWNER], 10);
    });

});

contract("Logic", async (accounts) => {

    it("constructor", async () => {
	await fnGas.apply(this, [accounts[ROBBER], Logic.new]);
    });

});

contract("Lease", async (accounts) => {
    
    it("constructor", async () => {
	let owner = accounts[OWNER];
	let tenant = accounts[TENANT];
	let start = now + 15*days;
	let fee = 1;
	let deposit = 2;
	await fnGas.apply(this, [owner, Lease.new, owner, tenant,
				  start, fee, deposit]);
    });

    it("singleton", async () => {
	await fnGas.apply(this, [accounts[OWNER], Lease.deployed]);
    });
    
    it("fallback", async () => {
	let instance = await Lease.deployed();
    	txGas.apply(this, [accounts[TENANT], instance.address, 10]);
	await instance.mockZeroBalance();
    });
    
    it("openDoor()", async () => {
	let instance = await Lease.deployed();
	await fnGas.apply(this, [accounts[OWNER], instance.openDoor]);
    });
    
    it("withdraw()", async () => {
	let instance = await Lease.deployed();
	await fnGas.apply(this, [accounts[OWNER], instance.withdraw]);
    });
    
    it("notifyTermination()", async () => {
	let instance = await Lease.deployed();
	await instance.mockTime(now + 1*months);
	let earlyEnd = now + 2*months;
	await fnGas.apply(this, [accounts[OWNER], instance.notifyTermination,
				 earlyEnd]);
    });
    
    it("withdrawRemainder()", async () => {
	let instance = await Lease.deployed();
	web3.eth.sendTransaction({from:accounts[TENANT], to:instance.address,
				  value:10000});
	await instance.mockEnd(now + 2*months);
	await instance.mockTime(now + 4*months);
	await fnGas.apply(this, [accounts[TENANT], instance.withdrawRemainder]);
	await instance.mockZeroBalance();
    });
    
    it("updateTenantState()", async () => {
	let instance = await Lease.deployed();
	await fnGas.apply(this, [accounts[OWNER], instance.updateTenantState]);
    });
    
    it("getTime()", async () => {
	let instance = await Lease.deployed();
	await fnGas.apply(this, [accounts[OWNER], instance.getTime]);
    });

    it("terminate()", async () => {
	let instance = await Lease.deployed();
	await instance.mockTime(now + 3*months);
	await instance.mockEnd(now + 2*months);
	await fnGas.apply(this, [accounts[OWNER], instance.terminate]);
    });
    
});
