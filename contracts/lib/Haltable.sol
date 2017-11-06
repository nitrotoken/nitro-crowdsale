pragma solidity ^0.4.16;

import './Ownable.sol';

contract Haltable is Ownable {

  bool public halted = false;

  modifier notHalted(){
    require(!halted);
    _;
  }

  function halt() external onlyOwner returns (bool) {
    halted = true;
    return halted;
  }

  function unHalt() external onlyOwner returns (bool) {
    halted = false;
    return halted;
  }

}