const helper = require("./helper.js");
const OWNER = helper.OWNER;
const TENANT = helper.TENANT;
const now = helper.now;
const days = helper.days;
const finney = helper.finney;
const gasPrice = helper.gasPrice;

const Lease = artifacts.require("./Lease.sol");

contract("Lease", async (accounts) => {
    
    it("gets the singleton", async () => {
	let instance = await Lease.deployed();
    });

    it("creates a new instance", async () => {
	let owner = accounts[OWNER];
	let tenant = accounts[TENANT];
	let start = now + 15*days;
	let fee = 1*finney;
	let deposit = 2*finney;
	let instance = await Lease.new(owner, tenant, start, fee, deposit,
				       {from:owner, gasPrice:gasPrice});
    });

});
