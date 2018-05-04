const helper = require("./helper.js");
const assertThrowsAsync = helper.assertThrowsAsync;
const now = helper.now;
const days = helper.days;
const months = helper.months;
const finney = helper.finney;
const gasPrice = helper.gasPrice;
const OWNER = helper.OWNER;
const TENANT = helper.TENANT;
const ROBBER = helper.ROBBER;
const ONTIME = helper.ONTIME;
const BELATED = helper.BELATED;
const DEFAULTED = helper.DEFAULTED;

const Lease = artifacts.require("./LeaseMock.sol");

const Logic = artifacts.require("./Logic.sol");

async function newLease(accounts) {
    let owner = accounts[OWNER];
    let tenant = accounts[TENANT];
    let start = now + 15*days;
    let fee = 1*finney;
    let deposit = 2*finney;
    return Lease.new(owner, tenant, start, fee, deposit,
		     {from:owner, gasPrice:gasPrice});
};

contract("Lease", async (accounts) => {

    afterEach("instance cleanup", async () => {
	let instance = await Lease.deployed();
	let start = await instance.start();
    	await instance.mockTime(start.sub(15*days));
    	await instance.mockEnd(0);
    	await instance.mockTenantState(BELATED);
    	await instance.mockZeroBalance();
    });

    describe("constructor", async () => {
    
	it("should be initialized correctly by the owner", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*finney;
	    let deposit = 2*finney;
	    let instance = await Lease.new(owner, tenant, start, fee, deposit,
					   {from:owner, gasPrice:gasPrice});
	    assert.equal(owner, await instance.owner());
	    assert.equal(tenant, await instance.tenant());
	    assert.equal(start, await instance.start());
	    assert.equal(fee, await instance.fee());
	    assert.equal(deposit, await instance.deposit());
	    assert.equal(BELATED, await instance.tenantState());
	    assert.equal(0, await instance.withdrawn());
	    assert.equal(0, await instance.end());
	});
    
	it("should be initialized correctly by the tenant", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*finney;
	    let deposit = 2*finney;
	    let instance = await Lease.new(owner, tenant, start, fee, deposit,
					   {from:tenant, gasPrice:gasPrice});
	    assert.equal(owner, await instance.owner());
	    assert.equal(tenant, await instance.tenant());
	    assert.equal(start, await instance.start());
	    assert.equal(fee, await instance.fee());
	    assert.equal(deposit, await instance.deposit());
	    assert.equal(BELATED, await instance.tenantState());
	    assert.equal(0, await instance.withdrawn());
	    assert.equal(0, await instance.end());
	});
    
	it("should not let a third party initialize it", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*finney;
	    let deposit = 2*finney;
	    await assertThrowsAsync(
		async () => {
		    let instance = await Lease.new(owner, tenant, start, fee,
						   deposit,
						   {from:accounts[ROBBER],
						    gasPrice:gasPrice});
		},
		    /revert/
	    );


	});

	it("should not let the owner be her own tenant", async () => {
	    let owner = accounts[OWNER];
	    let start = now + 15*days;
	    let fee = 1*finney;
	    let deposit = 2*finney;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, owner, start, fee, deposit,
				    {from:owner, gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("should not let the start date be in the past", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now - 15*days;
	    let fee = 1*finney;
	    let deposit = 2*finney;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit,
				    {from:owner, gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("should not allow a zero fee", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 0*finney;
	    let deposit = 2*finney;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit,
				    {from:owner, gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("shouldn't allow a deposit smaller than twice the fee", async () => {
	    let owner = accounts[OWNER];
	    let tenant = accounts[TENANT];
	    let start = now + 15*days;
	    let fee = 1*finney;
	    let deposit = 1.9*finney;
	    await assertThrowsAsync(
		async () => {
		    await Lease.new(owner, tenant, start, fee, deposit,
				    {from:owner, gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

    });

    describe("fallback", async () => {

	it("should allow payments from the tenant", async () => {
	    let instance = await Lease.deployed();
	    let balance0 = web3.eth.getBalance(instance.address).toNumber();
	    let amount = 1*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:amount, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address).toNumber();
	    let balance = balance1 - balance0;
	    assert.equal(balance, amount);
	});

	it("should disallow payments not coming from the tenant", async () => {
	    let instance = await Lease.deployed();
	    let tx = {from:accounts[ROBBER], to:instance.address,
		      value:1*finney, gasPrice:gasPrice};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments from the owner", async () => {
	    let instance = await Lease.deployed();
	    let tx = {from:accounts[OWNER], to:instance.address,
		      value:1*finney, gasPrice:gasPrice};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("should disallow payments if the tenant defaulted", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTenantState(DEFAULTED, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:1*finney, gasPrice:gasPrice};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("allows payments if the end date is in the future", async () => {
	    let instance = await Lease.deployed()
	    let balance0 = web3.eth.getBalance(instance.address);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    let amount = 1*finney;
	    let tx = {from:accounts[TENANT], to:instance.address, value:amount,
		      gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    let balance1 = web3.eth.getBalance(instance.address);
	    let balance = balance1 - balance0;
	    assert.equal(balance, amount);
	});

	it("disallows payments if the end date is in the past", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:1*finney, gasPrice:gasPrice};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("disallows payments if the amount is zero", async () => {
	    let instance = await Lease.deployed();
	    let tx = {from:accounts[TENANT], to:instance.address, value:0,
		      gasPrice:gasPrice};
	    assert.throws(
		() => {
		    web3.eth.sendTransaction(tx);
		},
		    /revert/
	    );
	});

	it("emits an event upon a successful payment", async () => {
	    let instance = await Lease.deployed();
	    let amount = 1*finney;
	    let tx = {from:accounts[TENANT], to:instance.address, value:amount,
		      gasPrice:gasPrice};
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
	    let instance = await Lease.deployed();
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT],
							gasPrice:gasPrice});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER],
						       gasPrice:gasPrice});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER],
							gasPrice:gasPrice});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the start date is in the past, only tenant", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT],
							gasPrice:gasPrice});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER],
						       gasPrice:gasPrice});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER],
							gasPrice:gasPrice});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the tenant defaulted, only owner", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    await instance.mockTenantState(DEFAULTED, {gasPrice:gasPrice});
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT],
							gasPrice:gasPrice});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER],
						       gasPrice:gasPrice});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER],
							gasPrice:gasPrice});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the future, only tenant", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    await instance.mockEnd(now + 12.5*months, {gasPrice:gasPrice});
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT],
							gasPrice:gasPrice});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER],
						       gasPrice:gasPrice});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER],
							gasPrice:gasPrice});
	    assert.equal(tenantOpened, true);
	    assert.equal(ownerOpened, false);
	    assert.equal(robberOpened, false);
	});

	it("if the end date is in the past, only owner", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 8*months, {gasPrice:gasPrice})
	    await instance.mockEnd(now + 7.5*months, {gasPrice:gasPrice});
	    let tenantOpened = await instance.openDoor({from:accounts[TENANT],
							gasPrice:gasPrice});
	    let ownerOpened = await instance.openDoor({from:accounts[OWNER],
						       gasPrice:gasPrice});
	    let robberOpened = await instance.openDoor({from:accounts[ROBBER],
							gasPrice:gasPrice});
	    assert.equal(tenantOpened, false);
	    assert.equal(ownerOpened, true);
	    assert.equal(robberOpened, false);
	});
	
    });

    describe("withdraw()", async () => {
	
	it("shouldn't allow the tenant to withdraw", async () => {
	    let instance = await Lease.deployed();
 	    await assertThrowsAsync(
		async () => {
		    await instance.withdraw({from:accounts[TENANT],
					     gasPrice:gasPrice});
		},
		/revert/
	    );
	});

	it("the owner can't withdraw before the start date", async () => {
	    let instance = await Lease.deployed();
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*finney};
	    web3.eth.sendTransaction(tx);
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), 0*finney);
	});

	it("should allow the owner to withdraw her first rent", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*finney};
	    web3.eth.sendTransaction(tx);
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let withdrawn = balance.add(txFee);
	    assert.equal(withdrawn.toNumber(), 1*finney);
	});

	it("the owner can't withdraw rent paid for in advance", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:4*finney};
	    web3.eth.sendTransaction(tx);
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 1*finney);
	});

	it("the owner can't withdraw more than once a month", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:4*finney};
	    web3.eth.sendTransaction(tx);
	    await instance.withdraw({from:accounts[OWNER], gasPrice:gasPrice});
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 0*finney);
	});

	it("if the tenant is belated, use some of the deposit", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 2*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*finney};
	    web3.eth.sendTransaction(tx);
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 2*finney);
	});

	it("if the tenant has defaulted, use all the deposit", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:3*finney};
	    web3.eth.sendTransaction(tx);
	    let balance0 = web3.eth.getBalance(accounts[OWNER]);
	    let result = await instance.withdraw({from:accounts[OWNER],
						  gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[OWNER]);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let balance = balance1.sub(balance0);
	    let rent = balance.add(txFee);
	    assert.equal(rent.toNumber(), 3*finney);
	});
	
    });

    describe("notifyTermination()", async () => {

	it("cannot be called before the start date", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    let earlyEnd = start + 2.5*months;
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(earlyEnd, 
						     {from:accounts[OWNER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});
	
	it("should allow the owner to call it", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(2.5*months);
	    let actualEnd = start.add(3*months);
	    await instance.notifyTermination(earlyEnd, {from:accounts[OWNER],
							gasPrice:gasPrice});
	    let obtained = await instance.end();
	    assert.equal(actualEnd.toNumber(), obtained.toNumber());
	});

	it("should allow the tenant to call it", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(2*months).add(15*days);
	    let actualEnd = start.add(3*months);
	    await instance.notifyTermination(earlyEnd, {from:accounts[TENANT],
							gasPrice:gasPrice});
	    let obtained = await instance.end();
	    assert.equal(actualEnd.toNumber(), obtained.toNumber());
	});

	it("should emit an event upon being called", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(2*months).add(15*days);
	    let actualEnd = start.add(3*months);
	    let terminationNotice = instance.TerminationNotice();
	    terminationNotice.watch((error, result) => {
		assert.equal("TerminationNotice", result.event);
		assert.ok("actualEnd" in result.args);
		assert.equal(actualEnd.toNumber(),
			     result.args.actualEnd.toNumber());
	    });
	    await instance.notifyTermination(earlyEnd, {from:accounts[OWNER],
							gasPrice:gasPrice});
	    terminationNotice.stopWatching();
	});

	it("shouldn't allow a third party to call it", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(2*months).add(15*days);
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(earlyEnd,
						     {from:accounts[ROBBER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("cannot be called twice", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(2*months).add(15*days);
	    await instance.notifyTermination(earlyEnd,
					     {from:accounts[TENANT],
					      gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(earlyEnd + 1*months,
						     {from:accounts[OWNER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("the actual end date can't be in less than a month...", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    let earlyEnd = start.add(1*months);
	    let actualEnd = earlyEnd;
	    await assertThrowsAsync(
		async () => {
		    await instance.notifyTermination(earlyEnd,
						     {from:accounts[OWNER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("...unless the tenant defaulted", async () => {
	    let instance = await Lease.deployed();
	    let start = await instance.start();
	    await instance.mockTime(start.add(15*days), {gasPrice:gasPrice});
	    await instance.mockTenantState(DEFAULTED, {gasPrice:gasPrice});
	    let earlyEnd = start.add(1*months);
	    let actualEnd = earlyEnd;
	    await instance.notifyTermination(earlyEnd, {from:accounts[OWNER],
							gasPrice:gasPrice});
	    let expected = await instance.end();
	    assert.equal(actualEnd.toNumber(), expected.toNumber());
	});
	
    });

    describe("terminate()", async () => {

	it("can be called by the owner", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    await instance.terminate({from:accounts[OWNER], gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.getTime({gasPrice:gasPrice});
		},
		    /not a contract/
	    );
	});

	it("can be called by the tenant", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    await instance.terminate({from:accounts[TENANT],
				      gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.getTime({gasPrice:gasPrice});
		},
		    /not a contract/
	    );
	});

	it("cannot be called by a third party", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.terminate({from:accounts[ROBBER],
					      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("cannot be called if the end date is 0", async () => {
	    let instance = await newLease(accounts);
	    await assertThrowsAsync(
		async () => {
		    await instance.terminate({from:accounts[OWNER],
					      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("cannot be called if the end date is in the future", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockTime(now + 2*months, {gasPrice:gasPrice});
	    await instance.mockEnd(now + 2*months + 1*days,
				   {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.terminate({from:accounts[OWNER],
					      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("cannot be called if the contract has balance", async () => {
	    let instance = await newLease(accounts);
	    let tx = {from:accounts[TENANT], to:instance.address, value:1};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.terminate({from:accounts[OWNER],
					      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("should emit an event upon termination", async () => {
	    let instance = await newLease(accounts);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 3*months, {gasPrice:gasPrice});
	    let terminated = instance.Terminated();
	    terminated.watch((error, result) => {
		assert.equal("Terminated", result.event);
	    });
	    await instance.terminate({from:accounts[OWNER], gasPrice:gasPrice});
	    terminated.stopWatching();
	});
	
    });

    describe("withdrawRemainder()", async () => {

	it("can be called by the tenant", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    let balance0 = web3.eth.getBalance(accounts[TENANT]);
	    let result = await instance.withdrawRemainder(
		{from:accounts[TENANT], gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[TENANT]);
	    let balance = balance1.sub(balance0);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let actualDeposit = balance.add(txFee);
	    assert.equal(deposit, actualDeposit.toNumber());
	});

	it("can't be called by the owner", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[OWNER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("can't be called by a third party", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(now + 2.5*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[ROBBER],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("can't be called if end is zero", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(0, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[TENANT],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("can't be called if the contract hasn't ended", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    await instance.mockEnd(now + 4.1*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[TENANT],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("can't be called if the contract ended < a month ago", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    await instance.mockEnd(now + 3*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months - 1, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[TENANT],
						      gasPrice:gasPrice});
		},
		    /revert/
	    );
	});

	it("can be called if the contract ended == a month ago", async () => {
	    let instance = await Lease.deployed();
	    let deposit = 2*finney;
	    let fees = 2*finney;
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:deposit+fees, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    let start = await instance.start();
	    await instance.mockEnd(start.add(2*months).add(15*days),
				   {gasPrice:gasPrice});
	    await instance.mockTime(start.add(3*months).add(15*days),
				    {gasPrice:gasPrice});
	    let balance0 = web3.eth.getBalance(accounts[TENANT]);
	    let result = await instance.withdrawRemainder(
		{from:accounts[TENANT], gasPrice:gasPrice});
	    let balance1 = web3.eth.getBalance(accounts[TENANT]);
	    let balance = balance1.sub(balance0);
	    let gasUsed = result.receipt.gasUsed;
	    let txFee = gasUsed * gasPrice;
	    let actualDeposit = balance.add(txFee);
	    assert.equal(deposit, actualDeposit.toNumber());
	});

	it("can't be called if the remainder is zero", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockEnd(now + 2*months, {gasPrice:gasPrice});
	    await instance.mockTime(now + 4*months, {gasPrice:gasPrice});
	    await assertThrowsAsync(
		async () => {
		    await instance.withdrawRemainder({from:accounts[TENANT],
						  gasPrice:gasPrice});
	    },
		    /revert/
	    );
	});
	
    });

    describe("updateTenantState()", async () => {

	it("should update the state if it changed", async () => {
	    let instance = await Lease.deployed();
	    let logic = await Logic.deployed();

	    let fee = 1000;
	    let deposit = 2000;
	    let end = 0;
	    let start = await instance.start();
	    let now = start.sub(15*24*60*60);
	    let month = await logic.getMonth(now, start, end);	    
	    let withdrawn = 0;
	    
	    console.log("instance.tenantState: " + (await instance.tenantState()).toNumber());
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:2*finney, gasPrice:gasPrice};
	    await web3.eth.sendTransaction(tx);
	    console.log("payment made.");
	    
	    let balance = await web3.eth.getBalance(instance.address);
	    console.log("balance: " + balance);
	    
	    let tenantBalance = await logic.getTenantBalance(balance, fee, deposit, withdrawn, month);
	    let ts = await logic.getTenantState(fee, deposit, month, tenantBalance);
	    console.log("logic.tenantState: " + ts.toNumber());
	    assert.notEqual(ONTIME, await instance.tenantState());
	    console.log("instance.tenantState: " + (await instance.tenantState()).toNumber());
	    let tenantStateChanged = instance.TenantStateChanged();
	    tenantStateChanged.watch(async (error, result) => {
		balance = web3.eth.getBalance(instance.address);
		console.log("balance: " + balance);
		tenantBalance = await logic.getTenantBalance(balance, fee, deposit, withdrawn, month);
		ts = await logic.getTenantState(fee, deposit, month, tenantBalance);
		console.log("logic.tenantState: " + ts.toNumber());
		console.log("TenantStateChanged:");
		console.log("--tenantState: " + result.args.stateNumber.toNumber());
		console.log("--tenantBalance: " + result.args.tenantBalance.toNumber());
	    });
	    ts = await logic.getTenantState(fee, deposit, month, tenantBalance);
	    console.log("logic.tenantState: " + ts.toNumber());
	    await instance.updateTenantState({from:accounts[OWNER],
					      gasPrice:gasPrice});
	    tenantStateChanged.stopWatching();
	    console.log("instance.updateTenantState().");
	    console.log("instance.tenantState: " + (await instance.tenantState()).toNumber());
	    let obtained = await instance.tenantState();
	    assert.equal(ONTIME, obtained.toNumber());
	});

	it("can be called by anyone", async () => {
	    let instance = await Lease.deployed();
	    let tx = {from:accounts[TENANT], to:instance.address,
		      value:2*finney, gasPrice:gasPrice};
	    web3.eth.sendTransaction(tx);
	    assert.notEqual(ONTIME, await instance.tenantState());
	    await instance.updateTenantState({from:accounts[ROBBER],
					      gasPrice:gasPrice});
	    let obtained = await instance.tenantState();
	    assert.equal(ONTIME, obtained.toNumber());	    
	});

	it("should emit an event if the tenant is belated", async () => {
	    let instance = await Lease.deployed();
	    let tenantBelated = instance.TenantStateChanged();
	    tenantBelated.watch((error, result) => {
		assert.equal("TenantStateChanged", result.event);
		assert.ok("tenantBalance" in result.args);
		assert.equal(-2*finney, result.args.tenantBalance);
	    });
	    await instance.updateTenantState({from:accounts[OWNER],
					      gasPrice:gasPrice});
	    tenantBelated.stopWatching();
	});

	it("should emit an event if the tenant has defaulted", async () => {
	    let instance = await Lease.deployed();
	    await instance.mockTime(now + 1*months, {gasPrice:gasPrice});
	    let tenantDefaulted = instance.TenantStateChanged();
	    tenantDefaulted.watch((error, result) => {
		assert.equal("TenantStateChanged", result.event);
		assert.ok("tenantBalance" in result.args);
		assert.equal(-3*finney, result.args.tenantBalance);
	    });
	    await instance.updateTenantState({from:accounts[OWNER],
					      gasPrice:gasPrice});
	    tenantDefaulted.stopWatching();
	});
	
    });
    
});

