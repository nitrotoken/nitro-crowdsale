pragma solidity ^0.4.16;

contract Ownable {

  address public owner = msg.sender;
  address private newOwner = address(0);

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address _newOwner) public onlyOwner {
    require(_newOwner != address(0));      
    newOwner = _newOwner;
  }

  function acceptOwnership() public {
    require(msg.sender != address(0));
    require(msg.sender == newOwner);

    owner = newOwner;
    newOwner = address(0);
  }

}