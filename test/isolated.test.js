const helper = require("./helper.js");
const finney = helper.finney;
const TENANT = helper.TENANT;

const Lease = artifacts.require("./LeaseMock.sol");

contract("Lease", async (accounts) => {

    it("", async () => {
	let lease = await Lease.deployed();
	console.log("initial state: " + await lease.tenantState());
	web3.eth.sendTransaction({from:accounts[TENANT], to:lease.address,
				  value:2*finney});
	await lease.updateTenantState();
	console.log("resulting state: " + await lease.tenantState());
	setTimeout(async () => {
	    await lease.updateTenantState();
	    console.log("delayed state: " + await lease.tenantState());
	}, 1000);
    });

});

