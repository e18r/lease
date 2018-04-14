pragma solidity ^0.4.21;

library Logic {

  enum State { onTime, belated, defaulted }

  function getWithdrawable(
			   uint _balance,
			   uint _fee,
			   uint _tenantState,
			   uint _withdrawn,
			   uint _month)
    public pure returns (uint) {
    if (State(_tenantState) == State.defaulted) {
      return _balance;
    }
    else {
      return _month * _fee - _withdrawn;
    }
  }

  function getTenantState(
			  uint _fee,
			  uint _deposit,
			  uint _month,
			  int _tenantBalance)
    public pure returns (uint) {
    if (_tenantBalance >= 0) {
      return uint(State.onTime);
    }
    else if (_tenantBalance + int(_deposit) >= int(_fee) || _month == 0) {
      return uint(State.belated);
    }
    else {
      return uint(State.defaulted);
    }
  }

  function getTenantBalance(
			    uint _balance,
			    uint _fee,
			    uint _deposit,
			    uint _withdrawn,
			    uint _month)
    public pure returns (int) {
    uint paid = _balance + _withdrawn;
    uint due = _deposit + _month * _fee;
    return int(paid) - int(due);
  }

  function getRemainder(uint _balance, uint _withdrawable)
    public pure returns (uint) {
    return _balance - _withdrawable;
  }

  function getMonth(uint _now, uint _start, uint _end)
    public pure returns (uint month) {
    if (_now < _start) {
      month = 0;
    }
    else if (_end != 0 && _now > _end) {
      month = (_end - _start) / (30 days);
    }
    else {
      uint duration = _now - _start;
      uint monthFloor = duration / (30 days);
      month = monthFloor;
      if (duration % (30 days) != 0) {
	month += 1;
      }
    }
  }

  function getActualEnd(uint start, uint earlyEnd)
    public pure returns (uint actualEnd) {
    uint earlyDuration = earlyEnd - start;
    uint earlyMonths = earlyDuration / (30 days);
    uint actualMonths = earlyMonths;
    if(earlyDuration % (30 days) >= 1 days) {
      actualMonths += 1;
    }
    uint actualDuration = actualMonths * 30 days;
    actualEnd = start + actualDuration;
  }

}
