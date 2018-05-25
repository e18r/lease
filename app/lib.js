import logicJSON from "../build/contracts/Logic.json";
import leaseJSON from "../build/contracts/Lease.json";
import linker from "solc/linker";
import moment from "moment";

function insertInput(web3, canvas, type, name, disabled) {
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
       || (type == "amount" && !Object.is(+input.value, NaN))) {
	input.style.border = "1px solid #00AA00";
    }
    else {
      input.style.border = "1px solid red";
    }
  };
  if(type == "address") {
    label.innerHTML += " address";
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
  canvas.appendChild(label);
  canvas.appendChild(document.createElement("br"));
}

async function deploy(web3, owner, tenant, startDate, fee, deposit) {
  let Logic = new web3.eth.Contract(logicJSON.abi);
  let logic = await Logic.deploy({
    data: logicJSON.bytecode
  }).send({
    from: owner,
    gasLimit: 500000
  });
  let Lease = new web3.eth.Contract(leaseJSON.abi);
  let linkedBytecode = linker.linkBytecode(leaseJSON.bytecode, {
    Logic: logic._address
  });
  let lease = await Lease.deploy({
    data: linkedBytecode,
    arguments: [tenant, startDate, fee, deposit]
  }).send({
    from: owner,
    gasLimit: 2000000
  });
  return lease;
}

export { insertInput, deploy };
