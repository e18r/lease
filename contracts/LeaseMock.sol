pragma solidity ^0.4.19;

import "./Lease.sol";
import "./Logic.sol";

contract LeaseMock is Lease {

  function LeaseMock(
		     address _owner,
		     address _tenant,
		     uint _start,
		     uint _fee,
		     uint _deposit)
    public Lease(_owner, _tenant, _start, _fee, _deposit) {}

  function mockStart(uint _start) public {
    start = _start;
  }

  function mockEnd(uint _end) public {
    end = _end;
  }

  function mockTenantState(Logic.State _tenantState) public {
    tenantState = _tenantState;
  }

}
