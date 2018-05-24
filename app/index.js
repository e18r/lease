import Web3 from "web3";
import { deploy } from "./lib.js";
import moment from "moment";

function insertInput(type, name) {
  let label = document.createElement("label");
  label.innerHTML = name;
  let input = document.createElement("input");
  input.setAttribute("id", name);
  input.style.border = "1px solid black";
  input.onchange = () => {
    if((type == "address" && web3.utils.isAddress(input.value))
       || (type == "date" && moment(input.value).isValid())
       || (type == "amount" && !Object.is(+input.value, NaN))) {
	input.style.border = "1px solid #00AA00";
    }
    else {
      input.style.border = "1px solid red";
    }
  };
  if(type == "address") {
    label.innerHTML += "'s address";
    input.setAttribute("size", 40);
  }
  else if(type == "date") {
    label.innerHTML += " date";
    input.setAttribute("size", 15);
  }
  else if(type == "amount") {
    label.innerHTML += " amount";
    input.setAttribute("size", 20);
  }
  label.innerHTML += ": ";
  label.appendChild(input);
  if(type == "amount") {
    label.insertAdjacentText("beforeend", " ETH");
  }
  document.body.appendChild(label);
  document.body.appendChild(document.createElement("br"));
}

function get(type, name) {
  let input = document.getElementById(name);
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
  let input = document.getElementById(name);
  input.setAttribute("disabled", true);
  if(type == "address") {
    input.value = value;
  }
  else if(type == "date") {
    input.value = moment(value, "X").format("MMMM Do Y");
  }
  else if(type == "amount") {
    input.value = web3.utils.fromWei(value, "ether");
  }
}

function setResult(type, data) {
  resultNotice.innerHTML = "";
  if(type == "success") {
    resultNotice.style.border = "1px solid #00AA00";
  }
  else if(type == "failure") {
    resultNotice.style.border = "1px solid red";
  }
  data.forEach((datum) => {
    resultNotice.insertAdjacentText("beforeend", datum);
    resultNotice.appendChild(document.createElement("br"));
  });
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
    submitButton.setAttribute("disabled", true);
    setResult("success", [
      "contract address: " +lease._address,
      "owner's address: " + await (await lease.methods.owner()).call()
    ]);
  }
  catch(error) {
    setResult("failure", [error])
  }
}

let web3 = new Web3();
let provider = new web3.providers.HttpProvider("http://127.0.0.1:8875");
web3.setProvider(provider);

insertInput("address", "tenant");
insertInput("date", "start");
insertInput("amount", "fee");
insertInput("amount", "deposit");

let submitButton = document.createElement("button");
submitButton.innerHTML = "create lease contract";
submitButton.onclick = submitContract;
document.body.appendChild(submitButton);

let resultNotice = document.createElement("div");
document.body.appendChild(resultNotice);
