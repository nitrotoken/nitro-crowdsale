pragma solidity ^0.4.18;

import './Whitepaper.sol';

contract Declaration is Whitepaper {

  event Verified(address indexed addr);
  
  mapping(address => bool) public verified;

  mapping(address => uint256) public weiOwed;
  mapping(address => uint256) public satOwed;
  mapping(address => uint256) public weiTokensOwed;
  mapping(address => uint256) public satTokensOwed;
  
  uint256 public weiLimit = 6 ether;
  uint256 public satLimit = 30000000;
  
  modifier withinPeriod(){
    require(isPresale() || isSale());
    _;
  }
  
  function isPresale() public constant returns (bool){
    return now>=preSaleStart && now<=preSaleEnd;
  }

  function isSale()  public constant returns (bool){
    return now >= saleStart && now <= saleEnd;
  }

  function rate() public constant returns (uint256) {
    if (isPresale()) {
      return preSaleRate;
    } else if (now>=saleStart && now<=(saleStartFirstDayEnd)){
      return saleRateFirstDay;
    } else if (now>(saleStartFirstDayEnd) && now<=(saleStartSecondDayEnd)){
      return saleRateSecondDay;
    }
    return saleRate;
  }
  
  function otherTokensSum() public constant returns (uint256 sum){
    sum = 0;
    sum += otherTokens[INTERACTIVE_TOKENS_INDEX];
    sum += otherTokens[ICANDY_TOKENS_INDEX];
    sum += otherTokens[CONSULTANT_TOKENS_INDEX];
    sum += otherTokens[NITRO_TEAM_TOKENS_INDEX];
    sum += otherTokens[RESERVED_TOKENS_INDEX];
  }

}