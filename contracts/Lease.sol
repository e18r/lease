pragma solidity ^0.4.21;

import "./Logic.sol";

contract Lease {

  address public owner;
  address public tenant;
  uint public start;
  uint public fee;
  uint public deposit;

  Logic.State public tenantState;
  uint public withdrawn;
  uint public end;

  event TenantPaid(uint amount);
  event TenantBelated(int tenantBalance);
  event TenantDefaulted(int tenantBalance);
  event TerminationNotice(uint actualEnd);
  event Terminated();

  function Lease(
		address _owner,
		address _tenant,
		uint _start,
		uint _fee,
		uint _deposit)
    public {
    require(_owner != _tenant);
    require(now < _start);
    require(_fee > 0);
    require(_deposit >= _fee * 2);
    owner = _owner;
    tenant = _tenant;
    start = _start;
    fee = _fee;
    deposit = _deposit;
    tenantState = Logic.State.belated;
    withdrawn = 0;
    end = 0;
  }

  function () external payable {
    require(msg.sender == tenant);
    require(tenantState != Logic.State.defaulted);
    require(end == 0 || getTime() <= end);
    require(msg.value > 0);
    emit TenantPaid(msg.value);
  }

  function openDoor() external view returns (bool) {
    if (getTime() >= start && tenantState != Logic.State.defaulted
	&& (end == 0 || getTime() <= end)) {
      return msg.sender == tenant;
    }
    else {
      return msg.sender == owner;
    }
  }
  
  function withdraw() external {
    require(msg.sender == owner);
    uint month = Logic.getMonth(getTime(), start, end);
    uint withdrawable = Logic.getWithdrawable(address(this).balance, fee,
					       uint(tenantState), withdrawn,
					       month);
    withdrawn += withdrawable;
    owner.transfer(withdrawable);
  }

  function notifyTermination(uint _earlyEnd) external {
    require(msg.sender == owner || msg.sender == tenant);
    require(getTime() >= start);
    require(end == 0);
    uint actualEnd = Logic.getActualEnd(start, _earlyEnd);
    require(actualEnd >= getTime() + 30 days
	    || tenantState == Logic.State.defaulted);
    emit TerminationNotice(actualEnd);
    end = actualEnd;
  }
  
  function terminate() external {
    require(msg.sender == owner || msg.sender == tenant);
    require(end != 0);
    require(getTime() > end);
    require(address(this).balance == 0);
    emit Terminated();
    selfdestruct(owner);
  }
  
  function withdrawRemainder() external {
    require(msg.sender == tenant);
    require(end != 0);
    require(getTime() >= end + 30 days);
    uint month = Logic.getMonth(getTime(), start, end);
    uint withdrawable = Logic.getWithdrawable(address(this).balance, fee,
					       uint(tenantState), withdrawn,
					       month);
    uint remainder = Logic.getRemainder(address(this).balance,
					       withdrawable);
    tenant.transfer(remainder);
  }

  function updateTenantState() external {
    uint month = Logic.getMonth(getTime(), start, end);
    int tenantBalance = Logic.getTenantBalance(address(this).balance, fee,
						deposit, withdrawn, month);
    tenantState = Logic.State(Logic.getTenantState(fee, deposit, month,
						     tenantBalance));
    if (tenantState == Logic.State.belated) {
      emit TenantBelated(tenantBalance);
    }
    else if (tenantState == Logic.State.defaulted) {
      emit TenantDefaulted(tenantBalance);
    }
  }
  
  function getTime() public view returns (uint) {
    return now;
  }

}
