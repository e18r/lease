import Web3 from "web3";
import { submitContract } from "./creation.js";
import { insertInput } from "./lib.js";

let web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8875");

function change() {
  console.log("change?");
}

function creation() {
  ownerCanvas.style.display = "none";
  ownerLink.style.color = "blue";
  creationCanvas.style.display = "block";
  creationLink.style.color = "grey";
}

function ownerAdmin() {
  creationCanvas.style.display = "none";
  creationLink.style.color = "blue";
  ownerCanvas.style.display = "block";
  ownerLink.style.color = "grey";
}

let info = document.createElement("div");
info.setAttribute("id", "info");
insertInput(web3, info, "address", "contract", false);
let changeButton = document.createElement("button");
changeButton.innerHTML = "change";
changeButton.onclick = change;
info.appendChild(changeButton);
info.appendChild(document.createElement("br"));
insertInput(web3, info, "address", "owner", true);
insertInput(web3, info, "address", "tenant", true);
insertInput(web3, info, "date", "start", true);
insertInput(web3, info, "amount", "fee", true);
insertInput(web3, info, "amount", "deposit", true);
document.body.appendChild(info);
document.body.appendChild(document.createElement("br"));

let index = document.createElement("div");
let creationLink = document.createElement("a");
creationLink.style.color = "blue";
creationLink.setAttribute("href", "#");
creationLink.innerHTML = "new contract";
creationLink.onclick = creation;
index.appendChild(creationLink);
index.insertAdjacentText("beforeend", " | ");
let ownerLink = document.createElement("a");
ownerLink.style.color = "blue";
ownerLink.setAttribute("href", "#");
ownerLink.innerHTML = "owner administration";
ownerLink.onclick = ownerAdmin;
index.appendChild(ownerLink);
index.appendChild(document.createElement("br"));
document.body.appendChild(index);
document.body.appendChild(document.createElement("hr"));

let creationCanvas = document.createElement("div");
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
let resultNotice = document.createElement("div");
resultNotice.setAttribute("id", "result");
creationCanvas.appendChild(resultNotice);

let ownerCanvas = document.createElement("div");
ownerCanvas.style.display = "none";
ownerCanvas.innerHTML = "owner";
document.body.appendChild(ownerCanvas);
