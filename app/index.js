import Web3 from "web3";
import { deploy } from "./lib.js";

let web3 = new Web3();
let provider = new web3.providers.HttpProvider("http://127.0.0.1:8875");
web3.setProvider(provider);

let owner = "0xD3a5aD09559d80cde193a21676E4A4ca299e7D93";
let tenant = "0x19833EdFea7EFD0bd82151FF63ff1370F0a91e04";
let startDate = 1528007512;
let fee = 1000;
let deposit = 2000;
let instance = deploy(web3, owner, tenant, startDate, fee, deposit)
    .then((instance) => {
      console.log(instance);
    });
