pragma solidity ^0.4.16;

import './token/HaltableToken.sol';

contract NitroToken is HaltableToken {
    
  string public constant name = "Nitro";
  string public constant symbol = "NOX";
  uint8 public constant decimals = 18;

  bool public halted = false;

  function NitroToken(uint256 _totalSupply) public {
    totalSupply = _totalSupply;
    balances[owner] = _totalSupply;
    Transfer(address(0), owner, _totalSupply);
  }
  
  function acceptOwnership() public {
    address oldOwner = owner;
    super.acceptOwnership();
    balances[owner] = balances[oldOwner];
    balances[oldOwner] = 0;
    Transfer(oldOwner, owner, balances[owner]);
  }

}