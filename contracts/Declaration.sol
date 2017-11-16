pragma solidity ^0.4.18;

import './NitroToken.sol';

contract Declaration {
  
  enum TokenTypes { crowdsale, interactive, icandy, consultant, team, reserve }
  mapping(uint => uint256) public balances;
  
  uint256 public preSaleStart = 1511020800;
  uint256 public preSaleEnd = 1511452800;
    
  uint256 public saleStart = 1512057600;
  uint256 public saleStartFirstDayEnd = saleStart + 1 days;
  uint256 public saleStartSecondDayEnd = saleStart + 3 days;
  uint256 public saleEnd = 1514304000;
  
  uint256 public teamFrozenTokens = 4800000 * 1 ether;
  uint256 public teamUnfreezeDate = saleEnd + 182 days;

  uint256 public presaleMinValue = 5 ether;
 
  uint256 public preSaleRate = 1040;
  uint256 public saleRate = 800;
  uint256 public saleRateFirstDay = 1000;
  uint256 public saleRateSecondDay = 920;

  NitroToken public token;

  function Declaration() public {
    balances[uint8(TokenTypes.crowdsale)] = 60000000 * 1 ether;
    balances[uint8(TokenTypes.interactive)] = 6000000 * 1 ether;
    balances[uint8(TokenTypes.icandy)] = 3000000 * 1 ether;
    balances[uint8(TokenTypes.consultant)] = 1200000 * 1 ether;
    balances[uint8(TokenTypes.team)] = 7200000 * 1 ether;
    balances[uint8(TokenTypes.reserve)] = 42600000 * 1 ether;
    token = new NitroToken(120000000 * 1 ether);
  }
  
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
  
}