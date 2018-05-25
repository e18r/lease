import Web3 from "web3";
import { deploy } from "./lib.js";
import moment from "moment";

let web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8875");

function get(type, name) {
  let input = document.getElementById("creation " + name);
  if(type == "address") {
    return input.value;
  }
  if(type == "date") {
    return moment(input.value).format("X");
  }
  if(type == "amount") {
    try {
      return web3.utils.toWei(input.value, "ether");
    }
    catch(error) {
      throw name + ": " + error
    }
  }
}

function set(type, name, value) {
  let input = document.getElementById("creation " + name);
  if(type == "address") {
    input.value = value;
  }
  else if(type == "date") {
    input.value = moment(value, "X").format("ddd, DD MMM YYYY");
  }
  else if(type == "amount") {
    input.value = web3.utils.fromWei(value, "ether");
  }
}

function setResult(type, message) {
  let resultNotice = document.getElementById("result");
  resultNotice.innerHTML = "";
  if(type == "success") {
    resultNotice.style.border = "1px solid #00AA00";
  }
  else if(type == "failure") {
    resultNotice.style.border = "1px solid red";
  }
  resultNotice.insertAdjacentText("beforeend", message);
}

async function submitContract() {
  try {
    let owner = await web3.eth.getCoinbase();    
    let tenant = get("address", "tenant");
    let start = get("date", "start");
    let fee = get("amount", "fee");
    let deposit = get("amount", "deposit");
    let lease = await deploy(web3, owner, tenant, start, fee, deposit)
    set("address", "tenant", await (await lease.methods.tenant()).call());
    set("date", "start", await (await lease.methods.start()).call());
    set("amount", "fee", await (await lease.methods.fee()).call());
    set("amount", "deposit", await (await lease.methods.deposit()).call());
    setResult("success", "contract created at " + lease._address);
    let contract = document.getElementById("info contract");
    contract.value = lease._address;
  }
  catch(error) {
    setResult("failure", error)
  }
}

export { submitContract };
