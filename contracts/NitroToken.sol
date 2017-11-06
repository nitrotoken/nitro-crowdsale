pragma solidity ^0.4.16;

import './token/MintableToken.sol';

contract NitroToken is MintableToken {

  string public name   = "Nitro";
  string public symbol = "NOX";

  uint public decimals    = 6;
  uint public multiplier  = 10**decimals;

}