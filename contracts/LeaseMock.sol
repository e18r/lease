pragma solidity ^0.4.19;

import "./Lease.sol";
import "./Logic.sol";

contract LeaseMock is Lease {

  uint time;

  function LeaseMock(
		     address _owner,
		     address _tenant,
		     uint _start,
		     uint _fee,
		     uint _deposit)
    public Lease(_owner, _tenant, _start, _fee, _deposit) {}

  function mockTime(uint _time) public {
    time = _time;
  }

  function getTime() public view returns (uint) {
    if(time != 0) {
      return time;
    }
    else {
      return now;
    }
  }

  function mockEnd(uint _end) public {
    end = _end;
  }

  function mockTenantState(Logic.State _tenantState) public {
    tenantState = _tenantState;
  }

  function mockZeroBalance() public {
    owner.transfer(address(this).balance);
    withdrawn = 0;
  }

}
