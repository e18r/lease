import Web3 from "web3";
import { addrSelect, insertInput, get, set, setResult, deploy, fetch }
from "./lib.js";

let web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8875");
async function testWeb3() {
  try {
    await web3.eth.getCoinbase();
  }
  catch(error) {
    document.body.innerHTML = "";
    let web3Canvas = document.createElement("span");
    web3Canvas.setAttribute("id", "web3 result");
    document.body.appendChild(web3Canvas);
    setResult("failure", "web3", error);
  }
}
testWeb3();


async function fetchContract() {
  let contract = document.getElementById("info contract");
  try {
    let lease = fetch(contract.value);
    let owner = await (await lease.methods.owner()).call();
    let tenant = await (await lease.methods.tenant()).call();
    let start = await (await lease.methods.start()).call();
    let end = await (await lease.methods.end()).call();
    let fee = await (await lease.methods.fee()).call();
    let deposit = await (await lease.methods.deposit()).call();
    let state = await (await lease.methods.tenantState()).call();
    let balance = await web3.eth.getBalance(lease._address);
    let withdrawn = await (await lease.methods.withdrawn()).call();
    let currentAddress = document.getElementById("current address");
    currentAddress.value = contract.value;
    set("address", "info", "owner", owner);
    set("address", "info", "tenant", tenant);
    set("date", "info", "start", start);
    set("date", "info", "end", end);
    set("amount", "info", "fee", fee);
    set("amount", "info", "deposit", deposit);
    set("state", "info", "tenant state", state);
    set("amount", "info", "balance", balance);
    set("amount", "info", "withdrawn", withdrawn);
    setResult("success", "info", "contract successfully fetched");
  }
  catch(error) {
    setResult("failure", "info", error);
  }
}

async function submitContract() {
  try {
    let owner = get("addrSelect", "creation", "owner");
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
    contract.dispatchEvent(new Event("change"));
    fetchContract();
  }
  catch(error) {
    setResult("failure", "creation", error)
  }
}

async function pay() {
  try {
    let from = get("addrSelect", "pay", "sender");
    let to = document.getElementById("current address").value;
    let value = get("amount", "pay", "value");
    let transaction = {from:from, to:to, value:value};
    let receipt = await web3.eth.sendTransaction(transaction);
    let message = "transaction sent with hash " + receipt.transactionHash;
    setResult("success", "pay", message);
    fetchContract();
  }
  catch(error) {
    setResult("failure", "pay", error);
  }
}

function insertLink(canvas, id, name) {
  let link = document.createElement("a");
  links.push(link);
  link.setAttribute("id", id);
  link.style.color = "blue";
  link.setAttribute("href", "#");
  link.innerHTML = name;
  link.onclick = showCanvas;
  canvas.appendChild(link);
  canvas.insertAdjacentText("beforeend", " | ");
}

function createCanvas(id) {
  let canvas = document.createElement("div");
  canvases.push(canvas);
  canvas.setAttribute("id", id);
  canvas.style.display = "none";
  document.body.appendChild(canvas);
  return canvas;
}

let canvases = [];
let links = [];
function showCanvas(event) {
  let id = event.target.id;
  canvases.forEach((canvas) => {
    if(canvas.getAttribute("id") == id && canvas.style.display == "none") {
      canvas.style.display = "block";
    }
    else {
      canvas.style.display = "none";
    }
  });
  links.forEach((link) => {
    if(link.getAttribute("id") == id && link.style.color == "blue") {
      link.style.color = "grey";
    }
    else {
      link.style.color = "blue";
    }
  });
}

let info = document.createElement("div");
info.setAttribute("id", "info");
insertInput(info, "address", "contract", false);
let currentAddress = document.createElement("input");
currentAddress.setAttribute("id", "current address");
currentAddress.setAttribute("type", "hidden");
info.appendChild(currentAddress);
insertButton(info, fetchContract);
info.appendChild(document.createElement("br"));
insertInput(info, "address", "owner", true);
insertInput(info, "address", "tenant", true);
insertInput(info, "date", "start", true);
insertInput(info, "date", "end", true);
insertInput(info, "amount", "fee", true);
insertInput(info, "amount", "deposit", true);
insertInput(info, "state", "tenant state", true);
insertInput(info, "amount", "balance", true);
insertInput(info, "amount", "withdrawn", true);
document.body.appendChild(info);
document.body.appendChild(document.createElement("br"));

let index = document.createElement("div");
insertLink(index, "creation", "new contract");
insertLink(index, "pay", "pay rent");
insertLink(index, "door", "open door");
insertLink(index, "withdraw", "withdraw");
document.body.appendChild(index);
document.body.appendChild(document.createElement("hr"));

async function creationCanvas() {
  let creationCanvas = createCanvas("creation");
  await addrSelect(creationCanvas, "owner");
  insertInput(creationCanvas, "address", "tenant", false);
  insertInput(creationCanvas, "date", "start", false);
  insertInput(creationCanvas, "amount", "fee", false);
  insertInput(creationCanvas, "amount", "deposit", false);
  insertButton(creationCanvas, submitContract);
}
creationCanvas();

async function payCanvas() {
  let payCanvas = createCanvas("pay");
  await addrSelect(payCanvas, "sender");
  insertInput(payCanvas, "amount", "value", false);
  insertButton(payCanvas, pay);
}
payCanvas();

function insertButton(canvas, fn) {
  let id = canvas.getAttribute("id");
  let button = document.createElement("button");
  button.setAttribute("id", id + " button");
  button.innerHTML = id;
  button.onclick = fn;
  canvas.appendChild(button);
  let result = document.createElement("span");
  result.setAttribute("id", id + " result");
  canvas.appendChild(result);
}

async function door() {
  let address = document.getElementById("current address").value;
  let lease = fetch(address);
  let sender = document.getElementById("door sender").value;
  let result = await (await lease.methods.openDoor()).call({from:sender});
  setResult("success", "door", result);
}

async function doorCanvas() {
  let doorCanvas = createCanvas("door");
  await addrSelect(doorCanvas, "sender");
  insertButton(doorCanvas, door);
}
doorCanvas();

async function withdraw() {
  try {
    let sender = get("addrSelect", "withdraw", "sender");
    let address = document.getElementById("current address").value;
    let lease = fetch(address);
    let receipt = await (await lease.methods.withdraw()).send({from:sender});
    let message = "transaction sent with hash " + receipt.transactionHash;
    setResult("success", "withdraw", message);
  }
  catch(error) {
    setResult("failure", "withdraw", error);
  }
}

async function withdrawCanvas() {
  let withdrawCanvas = createCanvas("withdraw");
  await addrSelect(withdrawCanvas, "sender");
  insertButton(withdrawCanvas, withdraw);
}
withdrawCanvas();
