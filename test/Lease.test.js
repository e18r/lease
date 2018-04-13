const helper = require("./helper.js");
const assertThrowsAsync = helper.assertThrowsAsync;
const now = helper.now;
const days = helper.days;
const months = helper.months;
const ether = helper.ether;
const OWNER = 1;
const TENANT = 2;
const ROBBER = 3;
const BELATED = 1;
const DEFAULTED = 2;

const Lease = artifacts.require("./LeaseMock.sol");

async function newLease(accounts) {
    let owner = accounts[OWNER];
    let tenant = accounts[TENANT];
    let start = now + 15*days;
    let fee = 1*ether;
    let deposit = 2*ether;
    return Lease.new(owner, tenant, start, fee, deposit);
};

contract("Lease", async (accounts) => {

    describe("constructor", async () => {
    
	it("should initialize correctly", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    let instance = await Lease.new(owner, tenant, start, fee, deposit);
	    assert.equal(owner, await instance.owner());
	    assert.equal(tenant, await instance.tenant());
	    assert.equal(start, await instance.start());
	    assert.equal(fee, await instance.fee());
	    assert.equal(deposit, await instance.deposit());
	    assert.equal(BELATED, await instance.tenantState());
	    assert.equal(0, await instance.withdrawn());
	    assert.equal(0, await instance.end());
	});

	it("should not let the owner be her own tenant", async () => {
	    let owner = accounts[OWNER];
	    let start = now + 15*days;
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, owner, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("should not let the start date be in the past", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now - 15*days;
	    let fee = 1*ether;
	    let deposit = 2*ether;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("should not allow a zero fee", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 0*ether;
	    let deposit = 2*ether;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("shouldn't allow a deposit smaller than twice the fee", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*ether;
	    let deposit = 1.9*ether;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit);
		},
		    /revert/
	    );
	});

    });

    describe("fallback function", async () => {

	it("should allow payments from the tenant", async () => {
	    let instance = await newLease(accounts);
	    let balance0 = web3.eth.getBalance(instance.address).toNumber();
	    let amount = 1*ether;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:amount};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address).toNumber();
	    let balance = balance1 - balance0;
	    assert.equal(balance, amount);
	});

	it("should disallow payments not coming from the tenant", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[ROBBER], to:instance.address,
		      value:1*ether};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments from the owner", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[OWNER], to:instance.address, value:1*ether};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments if the tenant defaulted", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTenantState(DEFAULTED);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:1*ether};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("allows payments if the end date is in the future", async () => {
	    let instance = await newLease(accounts);
	    let balance0 = web3.eth.getBalance(instance.address);
	    await instance.mockEnd(now + 2*months);
	    let amount = 1*ether;
	    let tx = {from:accounts[TENANT], to:instance.address, value:amount};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address);
	    let balance = balance1 - balance0;
	    assert.equal(balance, amount);
	});

	it("disallows payments if the end date is in the past", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 3*months);
	    await instance.mockEnd(now + 2*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:1*ether};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("disallows payments if the amount is zero", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[TENANT], to:instance.address, value:0};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("emits an event upon a successful payment", async () => {
	    let instance = await newLease(accounts);
	    let amount = 1*ether;
	    let tx = {from:accounts[TENANT], to:instance.address, value:amount};
	    let tenantPaid = instance.TenantPaid();
	    tenantPaid.watch((error, result) => {
		assert.equal("TenantPaid", result.event);
		assert.ok("amount" in result.args);
		assert.equal(amount, result.args.amount);
	    });
	    web3.eth.sendTransaction(tx);
	    tenantPaid.stopWatching();
	});
	
    });

    describe("openDoor()", async () => {

	it("if the start date is in the future, only owner", async () => {
	    let instance = await newLease(accounts);
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT]});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER]});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the starte date is in the past, only tenant", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT]});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER]});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER]});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the tenant defaulted, only owner", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    await instance.mockTenantState(DEFAULTED);
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT]});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER]});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the future, only tenant", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    await instance.mockEnd(now + 12*months);
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT]});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER]});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER]});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the past, only owner", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 8*months)
	    await instance.mockEnd(now + 7*months);
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT]});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER]});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});
	
    });

    describe("withdraw()", async () => {
	
	it("shouldn't allow the tenant to withdraw", async () => {
	    let instance = await newLease(accounts);
 	    await assertThrowsAsync(
		async () => {
		    await instance.withdraw({from:accounts[TENANT]});
		},
		/revert/
	    );
	});

	it("the owner can't withdraw before the start date", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*ether};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), 0*ether);
	});

	it("should allow the owner to withdraw her first rent", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*ether};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), 1*ether);
	});

	it("the owner can't withdraw rent paid for in advance", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:4*ether};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 1*ether);
	});

	it("the owner can't withdraw more than once a month", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:4*ether};
	    web3.eth.sendTransaction(tx);
	    await instance.withdraw({from:accounts[OWNER]});
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 0*ether);
	});

	it("if the tenant is belated, use some of the deposit", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 2*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*ether};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 2*ether);
	});

	it("if the tenant has defaulted, use all the deposit", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 3*months);
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*ether};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER]});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 3*ether);
	});
	
    });

    describe("notifyTermination()", async () => {

	it("cannot be called before the start date", async () => {
	    let instance = await newLease(accounts);
	    let end = now + 3*months;
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(end,
						     {from:accounts[OWNER]});
		},
		    /revert/
	    );
	});
	
	it("should allow the owner to call it", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 3*months;
	    await instance.notifyTermination(end, {from:accounts[OWNER]});
	    assert.equal(end, await instance.end());
	});

	it("should allow the tenant to call it", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 3*months;
	    await instance.notifyTermination(end, {from:accounts[TENANT]});
	    assert.equal(end, await instance.end());
	});

	it("should emit an event upon being called", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 3*months;
	    let terminationNotice = instance.TerminationNotice();
	    terminationNotice.watch((error, result) => {
		assert.equal("TerminationNotice", result.event);
		assert.ok("end" in result.args);
		assert.equal(end, result.args.end);
	    });
	    await instance.notifyTermination(end, {from:accounts[OWNER]});
	    terminationNotice.stopWatching();
	});

	it("shouldn't allow a third party to call it", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 3*months;
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(end,
						     {from:accounts[ROBBER]});
		},
		    /revert/
	    );
	});

	it("cannot be called twice", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 3*months;
	    await instance.notifyTermination(end,
					     {from:accounts[TENANT]});
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(end + 1*months,
						     {from:accounts[OWNER]});
		},
		    /revert/
	    );
	});

	it("the end date can't be in less than a month...", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    let end = now + 1.5*months;
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(end,
						     {from:accounts[OWNER]});
		},
		    /revert/
	    );
	});

	it("...unless the tenant defaulted", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 1*months);
	    await instance.mockTenantState(DEFAULTED);
	    let end = now + 1.5*months;
	    await instance.notifyTermination(end, {from:accounts[OWNER]});
	    assert.equal(end, await instance.end());
	});
	
    });
    
});

