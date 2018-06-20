import Web3 from "web3";
import logicJSON from "../build/contracts/Logic.json";
import leaseJSON from "../build/contracts/Lease.json";
import leaseMockJSON from "../build/contracts/LeaseMock.json";
import linker from "solc/linker";
import moment from "moment";

let web3 = new Web3(Web3.givenProvider);
let state = {
  0: "on time",
  1: "belated",
  2: "defaulted",
  "on time": 0,
  "belated": 1,
  "defaulted": 2
};

async function addrSelect(canvas, name) {
  let label = document.createElement("label");
  label.innerHTML = name + " address: ";
  let select = document.createElement("select");
  select.setAttribute("id", canvas.getAttribute("id") + " " + name);
  let accounts = await web3.eth.getAccounts();
  accounts.forEach((account) => {
    let option = document.createElement("option");
    option.setAttribute("value", account);
    option.innerHTML = account;
    select.appendChild(option);
  });
  label.appendChild(select);
  canvas.appendChild(label);
  canvas.appendChild(document.createElement("br"))
}

function insertBox(canvas, name, disabled) {
  let label = document.createElement("label");
  label.innerHTML = name + "? ";
  let box = document.createElement("input");
  box.setAttribute("type", "checkbox");
  box.setAttribute("id", canvas.getAttribute("id") + " " + name);
  if(disabled) {
    box.setAttribute("disabled", true);
  }
  label.appendChild(box);
  canvas.appendChild(label);
  canvas.appendChild(document.createElement("br"));
}

function insertInput(canvas, type, name, disabled) {
  let label = document.createElement("label");
  label.innerHTML = name;
  let input = document.createElement("input");
  input.setAttribute("id", canvas.getAttribute("id") + " " + name);
  if(disabled) {
    input.setAttribute("disabled", true);
  }
  input.style.border = "1px solid black";
  input.onchange = () => {
    if((type == "address" && web3.utils.isAddress(input.value))
       || (type == "date" && moment(input.value).isValid())
       || (type == "amount" && !Object.is(+input.value, NaN))
       || (type == "state" && Object.values(state).includes(input.value))) {
	input.style.border = "1px solid #00AA00";
    }
    else {
      input.style.border = "1px solid red";
    }
  };
  if(type == "address") {
    label.innerHTML += " address";
    input.setAttribute("size", 55);
  }
  else if(type == "date") {
    label.innerHTML += " date";
    input.setAttribute("size", 25);
  }
  else if(type == "amount") {
    label.innerHTML += " amount";
    input.setAttribute("size", 20);
  }
  else if(type == "state") {
    input.setAttribute("size", 7);
  }
  label.innerHTML += ": ";
  label.appendChild(input);
  if(type == "amount") {
    label.insertAdjacentText("beforeend", " ETH");
  }
  canvas.appendChild(label);
  canvas.appendChild(document.createElement("br"));
}

function get(type, canvas, name) {
  let input = document.getElementById(canvas + " " + name);
  if(type == "address") {
    return input.value;
  }
  if(type == "addrSelect") {
    return input.selectedOptions[0].value;
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
  if(type == "state") {
    return state[input.value];
  }
  if(type == "box") {
    return input.checked;
  }
}

function set(type, canvas, name, value) {
  let input = document.getElementById(canvas + " " + name);
  if(type == "address") {
    input.value = value;
  }
  else if(type == "date") {
    if(value == 0) {
      input.value = "(not set)";
    }
    else {
      input.value = moment(value, "X").format();
    }
  }
  else if(type == "amount") {
    input.value = web3.utils.fromWei(value, "ether");
  }
  else if(type == "state") {
    input.value = state[value];
  }
  else if(type == "box") {
    input.checked = value;
  }
}

function setResult(type, canvas, message) {
  let resultCanvas = document.getElementById(canvas + " result");
  resultCanvas.innerHTML = "";
  if(type == "wait") {
    resultCanvas.style.border = "1px solid black";
  }
  else if(type == "success") {
    resultCanvas.style.border = "1px solid #00AA00";
  }
  else if(type == "failure") {
    resultCanvas.style.border = "1px solid red";
  }
  resultCanvas.insertAdjacentText("beforeend", message);
}

async function deployLogic(web3, owner) {
  let Logic = new web3.eth.Contract(logicJSON.abi);
  let logic = await Logic.deploy({data: logicJSON.bytecode});
  let tx = {from: owner, gasLimit: 342447};
  let receipt = await logic.send(tx);
  return receipt._address;
}

async function getLogicAddress(web3, owner) {
  let network = await web3.eth.net.getNetworkType();
  if(network == "kovan") {
    return "0xf554ce01f91b09070d25c33e07c908cf89ec45db";
  }
  else return deployLogic(web3, owner);
}

async function deploy(web3, owner, tenant, startDate, fee, deposit, mock) {
  let logicAddress = await getLogicAddress(web3, owner);
  let Lease = new web3.eth.Contract(leaseJSON.abi);
  let linkedBytecode = linker.linkBytecode(leaseJSON.bytecode, {
    Logic: logicAddress
  });
  let lease = await Lease.deploy({
    data: linkedBytecode,
    arguments: [tenant, startDate, fee, deposit]
  });
  let tx = {from: owner, gasLimit: 1619819};
  let leaseReceipt = await lease.send(tx);
  if(mock) {
    let LeaseMock = new web3.eth.Contract(leaseMockJSON.abi);
    let linkedBytecode = linker.linkBytecode(leaseMockJSON.bytecode, {
      Logic: logicAddress,
      Lease: leaseReceipt._address
    });
    let leaseMock = await LeaseMock.deploy({
      data: linkedBytecode,
      arguments: [tenant, startDate, fee, deposit]
    });
    let tx = {from: owner, gasLimit: 1619819};
    let leaseMockReceipt = await leaseMock.send(tx);
    return leaseMockReceipt;
  }
  else {
    return lease;
  }
}

function fetch(address) {
  let abi = leaseMockJSON.abi;
  return new web3.eth.Contract(abi, address);
}

export { addrSelect, insertBox, insertInput, get, set, setResult, deploy,
	 fetch };
