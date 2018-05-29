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
    if(link.getAttribute("id") == id) {
      link.style.color = "grey";
    }
    else {
      link.style.color = "blue";
    }
  });
}

let info = document.createElement("div");
info.setAttribute("id", "info");
insertInput(web3, info, "address", "contract", false);
let fetchButton = document.createElement("button");
fetchButton.innerHTML = "fetch";
fetchButton.onclick = fetchContract;
info.appendChild(fetchButton);
let infoResult = document.createElement("span");
infoResult.setAttribute("id", "info result");
info.appendChild(infoResult);
info.appendChild(document.createElement("br"));
insertInput(web3, info, "address", "owner", true);
insertInput(web3, info, "address", "tenant", true);
insertInput(web3, info, "date", "start", true);
insertInput(web3, info, "date", "end", true);
insertInput(web3, info, "amount", "fee", true);
insertInput(web3, info, "amount", "deposit", true);
insertInput(web3, info, "state", "tenant state", true);
insertInput(web3, info, "amount", "balance", true);
insertInput(web3, info, "amount", "withdrawn", true);
document.body.appendChild(info);
document.body.appendChild(document.createElement("br"));

let index = document.createElement("div");
let creationLink = document.createElement("a");
links.push(creationLink);
creationLink.setAttribute("id", "creation");
creationLink.style.color = "blue";
creationLink.setAttribute("href", "#");
creationLink.innerHTML = "new contract";
creationLink.onclick = showCanvas;
index.appendChild(creationLink);
index.insertAdjacentText("beforeend", " | ");
let ownerLink = document.createElement("a");
links.push(ownerLink);
ownerLink.setAttribute("id", "owner");
ownerLink.style.color = "blue";
ownerLink.setAttribute("href", "#");
ownerLink.innerHTML = "owner administration";
ownerLink.onclick = showCanvas;
index.appendChild(ownerLink);
index.appendChild(document.createElement("br"));
document.body.appendChild(index);
document.body.appendChild(document.createElement("hr"));

let creationCanvas = document.createElement("div");
canvases.push(creationCanvas);
creationCanvas.style.display = "none";
document.body.appendChild(creationCanvas);
creationCanvas.setAttribute("id", "creation");
insertInput(web3, creationCanvas, "address", "tenant", false);
insertInput(web3, creationCanvas, "date", "start", false);
insertInput(web3, creationCanvas, "amount", "fee", false);
insertInput(web3, creationCanvas, "amount", "deposit", false);
let submitButton = document.createElement("button");
submitButton.setAttribute("id", "submit");
submitButton.innerHTML = "new contract";
submitButton.onclick = submitContract;
creationCanvas.appendChild(submitButton);
let creationResult = document.createElement("span");
creationResult.setAttribute("id", "creation result");
creationCanvas.appendChild(creationResult);

let ownerCanvas = document.createElement("div");
canvases.push(ownerCanvas);
ownerCanvas.setAttribute("id", "owner");
ownerCanvas.style.display = "none";
ownerCanvas.innerHTML = "owner";
document.body.appendChild(ownerCanvas);
