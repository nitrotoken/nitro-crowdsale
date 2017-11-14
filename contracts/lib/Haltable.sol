pragma solidity ^0.4.16;

import './Ownable.sol';

contract Haltable is Ownable {

  event Halt();
  event Unhalt();
  
  bool public halted = false;

  /**
   * @dev modifier to allow actions only when the contract is not halted
   */
  modifier notHalted(){
    if(msg.sender!=owner){
      require(!halted);
    }
    _;
  }

  /**
   * @dev called by the owner to halt
   */
  function halt() onlyOwner public {
    halted = true;
    Halt();
  }

  /**
   * @dev called by the owner to unhalt
   */
  function unhalt() onlyOwner public {
    halted = false;
    Unhalt();
  }

}