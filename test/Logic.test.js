let Logic = artifacts.require("./Logic.sol");

contract("Logic", async (accounts) => {

    describe("getWithdrawable()", async () => {

	it("returns the entire balance if the tenant defaulted", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(10);
	    let fee = web3.toWei(1);
	    let tenantState = 2;
	    let withdrawn = web3.toWei(2);
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, web3.toWei(10));
	});

	it("returns month * fee if the owner hasn't withdrawn", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(5);
	    let fee = web3.toWei(2);
	    let tenantState = 0;
	    let withdrawn = 0;
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, web3.toWei(6));
	});

	it("returns month * fee - withdrawn", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(5);
	    let fee = web3.toWei(2);
	    let tenantState = 0;
	    let withdrawn = web3.toWei(1);
	    let month = 3;
	    let withdrawable = await instance.getWithdrawable(balance, fee,
							      tenantState,
							      withdrawn, month);
	    assert.equal(withdrawable, web3.toWei(5));
	});

    });

    describe("getTenantState()", async () => {

	it("returns 0 if the tenant's balance is not negative", async () => {
	    let instance = await Logic.deployed();
	    let fee = web3.toWei(2);
	    let deposit = web3.toWei(4);
	    let month = 3;
	    let tenantBalance = 0;
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, 0);
	});

	it("returns 1 if tenantBalance + deposit >= fee", async () => {
	    let instance = await Logic.deployed();
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    let month = 1;
	    let tenantBalance = web3.toWei(-1);
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, 1);
	});

	it("returns 1 if month == 0", async () => {
	    let instance = await Logic.deployed();
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    let month = 0;
	    let tenantBalance = web3.toWei(-2);
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, 1);
	});

	it("returns 2 if tenantBalance + deposit < fee", async () => {
	    let instance = await Logic.deployed();
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    let month = 2;
	    let tenantBalance = web3.toWei(-2);
	    let tenantState = await instance.getTenantState(fee, deposit, month,
							    tenantBalance);
	    assert.equal(tenantState, 2);
	});
	
    });

    describe("getTenantBalance()", async () => {

	it("returns a positive balance", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(9);
	    let fee = web3.toWei(2);
	    let deposit = web3.toWei(4);
	    let withdrawn = web3.toWei(1);
	    let month = 2;
	    let tenantBalance = await instance.getTenantBalance(balance, fee,
								deposit,
								withdrawn,
								month);
	    assert.equal(tenantBalance, web3.toWei(2));
	});

	it("returns a negative balance", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(5);
	    let fee = web3.toWei(2);
	    let deposit = web3.toWei(4);
	    let withdrawn = web3.toWei(1);
	    let month = 2;
	    let tenantBalance = await instance.getTenantBalance(balance, fee,
								deposit,
								withdrawn,
								month);
	    assert.equal(tenantBalance, web3.toWei(-2));
	});
	
    });

    describe("getRemainder()", async () => {

	it("returns balance - withdrawable", async () => {
	    let instance = await Logic.deployed();
	    let balance = web3.toWei(10);
	    let withdrawable = web3.toWei(8);
	    let remainder = await instance.getRemainder(balance, withdrawable);
	    assert.equal(remainder, web3.toWei(2));
	});

    });

    describe("getMonth()", async () => {

	it("returns 0 if start is in the future", async () => {
	    let instance = await Logic.deployed();
	    let now = Math.round(Date.now() / 1000);
	    let start = now + 10000;
	    let month = await instance.getMonth(now, start);
	    assert.equal(month, 0);
	});

	it("returns 1 on the first month", async () => {
	    let instance = await Logic.deployed();
	    let now = Math.round(Date.now() / 1000);
	    let start = now - 10000;
	    let month = await instance.getMonth(now, start);
	    assert.equal(month, 1);
	});

	it("returns 22 on the 22nd month", async () => {
	    let instance = await Logic.deployed();
	    let start = Math.round(Date.now() / 1000);
	    let now = start + 21*30*24*60*60 + 10000;
	    let month = await instance.getMonth(now, start);
	    assert.equal(month, 22);
	});
	
    });

});
