import logicJSON from "../build/contracts/Logic.json";
import leaseJSON from "../build/contracts/Lease.json";
import linker from "solc/linker";

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
    arguments: [owner, tenant, startDate, fee, deposit]
  }).send({
    from: owner,
    gasLimit: 2000000
  });
  return lease;
}

export { deploy };
