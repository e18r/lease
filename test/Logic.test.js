const helper = require("./helper.js");
const now = helper.now;
const days = helper.days;
const months = helper.months;
const ether = helper.ether;
const ONTIME = helper.ONTIME;
const BELATED = helper.BELATED;
const DEFAULTED = helper.DEFAULTED;

let Logic = artifacts.require("./Logic.sol");

contract("Logic", async (accounts) => {

    describe("getWithdrawable()", async () => {

	it("returns the entire balance if the tenant defaulted", async () => {
	    let instance = await Logic.deployed();
	    let balance = 10*ether;
	    let fee = 1*ether;
	    let tenantState = DEFAULTED;
	    let withdrawn = 2*ether;
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, 10*ether);
	});

	it("returns month * fee if the owner hasn't withdrawn", async () => {
	    let instance = await Logic.deployed();
	    let balance = 5*ether;
	    let fee = 2*ether;
	    let tenantState = ONTIME;
	    let withdrawn = 0*ether;
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, 6*ether);
	});

	it("returns month * fee - withdrawn", async () => {
	    let instance = await Logic.deployed();
	    let balance = 5*ether;
	    let fee = 2*ether;
	    let tenantState = ONTIME;
	    let withdrawn = 1*ether;
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, 5*ether);
	});

    });

    describe("getTenantState()", async () => {

	it("returns 0 if the tenant's balance is not negative", async () => {
	    let instance = await Logic.deployed();
	    let fee = 2*ether;
	    let deposit = 4*ether;
	    let month = 3;
	    let tenantBalance = 0*ether;
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, ONTIME);
	});

	it("returns 1 if tenantBalance + deposit >= fee", async () => {
	    let instance = await Logic.deployed();
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    let month = 1;
	    let tenantBalance = -1*ether;
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, BELATED);
	});

	it("returns 1 if month == 0", async () => {
	    let instance = await Logic.deployed();
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    let month = 0;
	    let tenantBalance = -2*ether;
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, BELATED);
	});

	it("returns 2 if tenantBalance + deposit < fee", async () => {
	    let instance = await Logic.deployed();
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    let month = 2;
	    let tenantBalance = -2*ether;
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, DEFAULTED);
	});
	
    });

    describe("getTenantBalance()", async () => {

	it("returns a positive balance", async () => {
	    let instance = await Logic.deployed();
	    let balance = 9*ether;
	    let fee = 2*ether;
	    let deposit = 4*ether;
	    let withdrawn = 1*ether;
	    let month = 2;
	    let tenantBalance = await instance.getTenantBalance(balance, fee,
								deposit,
								withdrawn,
								month);
	    assert.equal(tenantBalance, 2*ether);
	});

	it("returns a negative balance", async () => {
	    let instance = await Logic.deployed();
	    let balance = 5*ether;
	    let fee = 2*ether;
	    let deposit = 4*ether;
	    let withdrawn = 1*ether;
	    let month = 2;
	    let tenantBalance = await instance.getTenantBalance(balance, fee,
								deposit,
								withdrawn,
								month);
	    assert.equal(tenantBalance, -2*ether);
	});
	
    });

    describe("getRemainder()", async () => {

	it("returns balance - withdrawable", async () => {
	    let instance = await Logic.deployed();
	    let balance = 10*ether;
	    let withdrawable = 8*ether;
	    let remainder = await instance.getRemainder(balance, withdrawable);
	    assert.equal(remainder, 2*ether);
	});

    });

    describe("getMonth()", async () => {

	it("returns 0 if the start date is in the future", async () => {
	    let instance = await Logic.deployed();
	    let start = now + 15*days;
	    let end = 0;
	    let month = await instance.getMonth(now, start, end);
	    assert.equal(month, 0);
	});

	it("returns 1 on the first month", async () => {
	    let instance = await Logic.deployed();
	    let start = now - 15*days;
	    let end = now + 15*days;
	    let month = await instance.getMonth(now, start, end);
	    assert.equal(month, 1);
	});

	it("returns 22 on the exact 22nd month", async () => {
	    let instance = await Logic.deployed();
	    let start = now - 22*months;
	    let end = now + 2*months;
	    let month = await instance.getMonth(now, start, end);
	    assert.equal(month.toNumber(), 22);
	});

	it("if the contract ended, returns its duration", async () => {
	    let instance = await Logic.deployed();
	    let start = now - 13*months;
	    let end = now - 1*months;
	    let month = await instance.getMonth(now, start, end);
	    assert.equal(month.toNumber(), 12);
	});
    });

    describe("getActualEnd()", async () => {

	it("if the early end is 2.5 months, returns 3 months", async () => {
	    let instance = await Logic.deployed();
	    let start = now;
	    let earlyEnd = now + 2*months + 15*days;
	    let actualEnd = await instance.getActualEnd(start, earlyEnd);
	    assert.equal(now + 3*months, actualEnd);
	});

	it("if the early end is 3 months, returns 3 months", async () => {
	    let instance = await Logic.deployed();
	    let start = now;
	    let earlyEnd = now + 3*months;
	    let actualEnd = await instance.getActualEnd(0, months);
	    assert.equal(months, actualEnd.toNumber());
	});

	it("if the early end is 8 months 1 day, returns 9 months", async () => {
	    let instance = await Logic.deployed();
	    let start = now;
	    let earlyEnd = now + 8*months + 1*days;
	    let actualEnd = await instance.getActualEnd(start, earlyEnd);
	    assert.equal(now + 9*months, actualEnd);
	});

	it("if the early end is 8m 0d 23:59:59, returns 8 months", async () => {
	    let instance = await Logic.deployed();
	    let start = now;
	    let earlyEnd = now + 8*months + 1*days - 1;
	    let actualEnd = await instance.getActualEnd(start, earlyEnd);
	    assert.equal(now + 8*months, actualEnd);
	});
	
    });

});
