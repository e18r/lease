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
    input.setAttribute("size", 10);
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

async function deployContract() {
  try {
    let ownerInput = document.getElementById("owner");
    let tenantInput = document.getElementById("tenant");
    let startInput = document.getElementById("start");
    let feeInput = document.getElementById("fee");
    let depositInput = document.getElementById("deposit");
    let owner = ownerInput.value;
    let tenant = tenantInput.value;
    let startDate = moment(start.value).format("X");
    let fee = web3.utils.toWei(feeInput.value, "ether");
    let deposit = web3.utils.toWei(depositInput.value, "ether");
    let instance = await deploy(web3, owner, tenant, startDate, fee, deposit)
    ownerInput.setAttribute("disabled", true);
    tenantInput.setAttribute("disabled", true);
    startInput.setAttribute("disabled", true);
    feeInput.setAttribute("disabled", true);
    depositInput.setAttribute("disabled", true);
    deployButton.setAttribute("disabled", true);
    deployButton.innerHTML = "Lease contract created";
    resultNotice.style.border = "1px solid #00AA00";
    resultNotice.innerHTML = instance._address;
  }
  catch(error) {
    resultNotice.style.border = "1px solid red";
    resultNotice.innerHTML = error;
  }
}

let web3 = new Web3();
let provider = new web3.providers.HttpProvider("http://127.0.0.1:8875");
web3.setProvider(provider);

insertInput("address", "owner");
insertInput("address", "tenant");
insertInput("date", "start");
insertInput("amount", "fee");
insertInput("amount", "deposit");

let deployButton = document.createElement("button");
deployButton.innerHTML = "create Lease contract";
deployButton.onclick = deployContract;
document.body.appendChild(deployButton);

let resultNotice = document.createElement("div");
document.body.appendChild(resultNotice);
