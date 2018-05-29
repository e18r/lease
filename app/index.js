import Web3 from "web3";
import { insertInput, get, set, setResult, deploy, fetch } from "./lib.js";

let web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8875");

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
    contract.dispatchEvent(new Event("change"));
    fetchContract();
  }
  catch(error) {
    setResult("failure", "creation", error)
  }
}

async function pay() {
  let from = await web3.eth.getCoinbase();
  let to = document.getElementById("info contract").value;
  let value = document.getElementById("pay value").value;
  let hash = web3.eth.sendTransaction({from:from, to:to, value:value});
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
let fetchButton = document.createElement("button");
fetchButton.innerHTML = "fetch";
fetchButton.onclick = fetchContract;
info.appendChild(fetchButton);
let infoResult = document.createElement("span");
infoResult.setAttribute("id", "info result");
info.appendChild(infoResult);
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
insertLink(index, "function", "contract functions");
document.body.appendChild(index);
document.body.appendChild(document.createElement("hr"));

let creationCanvas = createCanvas("creation");
insertInput(creationCanvas, "address", "tenant", false);
insertInput(creationCanvas, "date", "start", false);
insertInput(creationCanvas, "amount", "fee", false);
insertInput(creationCanvas, "amount", "deposit", false);
let submitButton = document.createElement("button");
submitButton.setAttribute("id", "submit");
submitButton.innerHTML = "new contract";
submitButton.onclick = submitContract;
creationCanvas.appendChild(submitButton);
let creationResult = document.createElement("span");
creationResult.setAttribute("id", "creation result");
creationCanvas.appendChild(creationResult);

let payCanvas = createCanvas("pay");
insertInput(payCanvas, "amount", "value", false);
let payButton = document.createElement("button");
payButton.setAttribute("id", "pay button");
payButton.innerHTML = "pay";
payButton.onclick = pay;
payCanvas.appendChild(payButton);
let payResult = document.createElement("span");
payResult.setAttribute("id", "pay result");
payCanvas.appendChild(payResult);

let functionCanvas = createCanvas("function");
