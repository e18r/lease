    const Lease = artifacts.require("./Lease.sol");
    contract("Lease", async (accounts) => {
	it("Rinkeby delay problem", async () => {
	    let instance = await Lease.deployed();



	    // let's check the initial state
	    let state0 = await instance.tenantState();
	    console.log("initial state: " + state0);



	    // let's change the state
	    let tx = {from:accounts[2], to:instance.address, value:2000};
	    web3.eth.sendTransaction(tx);
	    await instance.updateTenantState();



	    // let's check if the state changed
	    let state1 = await instance.tenantState();
	    console.log("resulting state: " + state1);



	    // let's wait for one second and check the state again
	    setTimeout(async () => {
		await instance.updateTenantState();
		let state2 = await instance.tenantState();
		console.log("resulting state after 1 second: " + state2);
	    }, 1000);



	});
    });

