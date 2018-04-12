let Lease = artifacts.require("./LeaseMock.sol");
let assertThrowsAsync = require("./helpers.js").assertThrowsAsync;

async function newLease(accounts) {
    let owner = accounts[1];
    let tenant = accounts[2];
    let start = Math.round(Date.now() / 1000) + 1000;
    let fee = web3.toWei(1);
    let deposit = web3.toWei(2);
    return Lease.new(owner, tenant, start, fee, deposit);
};

contract("Lease", async (accounts) => {

    describe("constructor", async () => {
    
	it("should initialize correctly", async () => {
	    let owner = accounts[1];
	    let tenant = accounts[2];
	    let start = Math.round(Date.now() / 1000) + 1000;
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    let instance = await Lease.new(owner, tenant, start, fee, deposit);
	    assert.equal(owner, await instance.owner());
	    assert.equal(tenant, await instance.tenant());
	    assert.equal(start, await instance.start());
	    assert.equal(fee, await instance.fee());
	    assert.equal(deposit, await instance.deposit());
	    assert.equal(1, await instance.tenantState());
	    assert.equal(0, await instance.withdrawn());
	    assert.equal(0, await instance.end());
	});

	it("should not let the owner be her own tenant", async () => {
	    let owner = accounts[1];
	    let start = Math.round(Date.now() / 1000) + 10000;
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, owner, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("should not let the start date be in the past", async () => {
	    let owner = accounts[1];
	    let tenant = accounts[2];
	    let start = Math.round(Date.now() / 1000) - 1000;
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(2);
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("should not allow a zero fee", async () => {
	    let owner = accounts[1];
	    let tenant = accounts[2];
	    let start = Math.round(Date.now() / 1000) + 10000;
	    let fee = 0;
	    let deposit = web3.toWei(2);
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit);
		},
		    /revert/
	    );
	});

	it("shouldn't allow a deposit smaller than twice the fee", async () => {
	    let owner = accounts[1];
	    let tenant = accounts[2];
	    let start = Math.round(Date.now() / 1000) + 1000;
	    let fee = web3.toWei(1);
	    let deposit = web3.toWei(1.9);
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
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(1)};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address).toNumber();
	    let balance = balance1 - balance0;
	    assert.equal(balance, web3.toWei(1));
	});

	it("should disallow payments not coming from the tenant", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[3], to:instance.address,
		      value:web3.toWei(1)};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments from the owner", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[1], to:instance.address,
		      value:web3.toWei(1)};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments if the tenant defaulted", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTenantState(2);
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(1)};
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
	    let end = Math.round(Date.now() / 1000) + 1000;
	    await instance.mockEnd(end);
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(1)};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address);
	    let balance = balance1 - balance0;
	    assert.equal(balance, web3.toWei(1));
	});

	it("disallows payments if the end date is in the past", async () => {
	    let instance = await newLease(accounts);
	    let end = Math.round(Date.now() / 1000) - 1000;
	    await instance.mockEnd(end);
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(1)};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});
	
    });

    describe("openDoor()", async () => {

	it("if the start date is in the future, only owner", async () => {
	    let instance = await newLease(accounts);
	    let tenantOpened = await instance.openDoor({from:accounts[2]});
	    let ownerOpened = await instance.openDoor({from:accounts[1]});
	    let robberOpened = await instance.openDoor({from:accounts[3]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the starte date is in the past, only tenant", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 1000;
	    await instance.mockStart(start);
	    let tenantOpened = await instance.openDoor({from:accounts[2]});
	    let ownerOpened = await instance.openDoor({from:accounts[1]});
	    let robberOpened = await instance.openDoor({from:accounts[3]});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the tenant defaulted, only owner", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 1000;
	    await instance.mockStart(start);
	    await instance.mockTenantState(2);
	    let tenantOpened = await instance.openDoor({from:accounts[2]});
	    let ownerOpened = await instance.openDoor({from:accounts[1]});
	    let robberOpened = await instance.openDoor({from:accounts[3]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the future, only tenant", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 1000;
	    let end = Math.round(Date.now() / 1000) + 1000;
	    await instance.mockStart(start);
	    await instance.mockEnd(end);
	    let tenantOpened = await instance.openDoor({from:accounts[2]});
	    let ownerOpened = await instance.openDoor({from:accounts[1]});
	    let robberOpened = await instance.openDoor({from:accounts[3]});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the past, only owner", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 1000;
	    let end = Math.round(Date.now() / 1000) - 500;
	    await instance.mockStart(start);
	    await instance.mockEnd(end);
	    let tenantOpened = await instance.openDoor({from:accounts[2]});
	    let ownerOpened = await instance.openDoor({from:accounts[1]});
	    let robberOpened = await instance.openDoor({from:accounts[3]});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});
	
    });

    describe("withdraw()", async () => {
	
	it("shouldn't allow the tenant to withdraw", async () => {
	    let instance = await newLease(accounts);
 	    assertThrowsAsync(
		async () => {
		    await instance.withdraw({from:accounts[2]});
		},
		/revert/
	    );
	});

	it("the owner can't withdraw before the start date", async () => {
	    let instance = await newLease(accounts); // month 0
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(3)};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), 0);
	});

	it("should allow the owner to withdraw her first rent", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 10000;
	    await instance.mockStart(start); // month 1
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(3)};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), web3.toWei(1));
	});

	it("the owner can't withdraw rent paid for in advance", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 10000;
	    await instance.mockStart(start); // month 1
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(4)};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), web3.toWei(1));
	});

	it("the owner can't withdraw more than once a month", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 10000;
	    await instance.mockStart(start); // month 1
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(4)};
	    web3.eth.sendTransaction(tx);
	    await instance.withdraw({from:accounts[1]});
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), web3.toWei(0));
	});

	it("if the tenant is belated, use some of the deposit", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 30*24*60*60 - 10000;
	    await instance.mockStart(start); // month 2
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(3)};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), web3.toWei(2));
	});

	it("if the tenant has defaulted, use all the deposit", async () => {
	    let instance = await newLease(accounts);
	    let start = Math.round(Date.now() / 1000) - 2*30*24*60*60 - 10000;
	    await instance.mockStart(start); // month 3
	    let tx = {from:accounts[2], to:instance.address,
		      value:web3.toWei(3)};
	    web3.eth.sendTransaction(tx);
	    let gasPrice = 100000000000;
	    let balance0 = web3.eth.getBalance(accounts[1]);
	    let result = await instance.withdraw({from:accounts[1]});
	    let balance1 = web3.eth.getBalance(accounts[1]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), web3.toWei(3));
	});
	
    });
    
});

