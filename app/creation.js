import Web3 from "web3";
import { get, set, setResult, deploy } from "./lib.js";
import moment from "moment";

let web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8875");

async function submitContract() {
  try {
    let owner = await web3.eth.getCoinbase();    
    let tenant = get("address", "creation", "tenant");
    let start = get("date", "creation", "start");
    let fee = get("amount", "creation", "fee");
    let deposit = get("amount", "creation", "deposit");
    let lease = await deploy(web3, owner, tenant, start, fee, deposit)
    let actualTenant = await (await lease.methods.tenant()).call();
    let actualStart = await (await lease.methods.start()).call();
    let actualFee = await (await lease.methods.fee()).call();
    let actualDeposit = await (await lease.methods.deposit()).call();
    set("address", "creation", "tenant", actualTenant);
    set("date", "creation", "start", actualStart);
    set("amount", "creation", "fee", actualFee);
    set("amount", "creation", "deposit", actualDeposit);
    setResult("success", "creation", "contract created at " + lease._address);
    let contract = document.getElementById("info contract");
    contract.value = lease._address;
  }
  catch(error) {
    setResult("failure", "creation", error)
  }
}

export { submitContract };
