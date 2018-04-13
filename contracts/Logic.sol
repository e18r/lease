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

  function getMonth(uint _now, uint _start)
    public pure returns (uint) {
    if (_now < _start) {
      return 0;
    }
    else {
      return 1 + (_now - _start) / (30 days);
    }
  }

}
