pragma solidity ^0.4.18;

contract Whitepaper{
  
  /**
   * Tokens 
   */
  uint8 public constant INTERACTIVE_TOKENS_INDEX = 0;
  uint8 public constant ICANDY_TOKENS_INDEX = 1;
  uint8 public constant CONSULTANT_TOKENS_INDEX = 2;
  uint8 public constant NITRO_TEAM_TOKENS_INDEX = 3;
  uint8 public constant RESERVED_TOKENS_INDEX = 4;
  
  uint256 public crowdsaleTokens = 60000000 * 10**18;
  uint256[] public otherTokens = [
    6000000 * 1 ether,
    3000000 * 1 ether,
    1200000 * 1 ether,
    7200000 * 1 ether,
    42600000 * 1 ether
  ];

  uint256 public NITRO_TEAM_FROZEN_TOKENS = 4800000 * 10**18;
  
  uint256 public constant PRESALE_MIN_VALUE = 5 ether;
  
  /**
   * Rates
   */
  uint256 public constant preSaleRate = 1040;
  uint256 public constant saleRate = 800;
  uint256 public constant saleRateFirstDay = 1000;
  uint256 public constant saleRateSecondDay = 920;
  
  /**
   * Dates
   */
  uint256 public constant preSaleStart = 1511020800;
  uint256 public constant preSaleEnd = 1511452800;
    
  uint256 public constant saleStart = 1512057600;
  uint256 public constant saleStartFirstDayEnd = saleStart + 1 days;
  uint256 public constant saleStartSecondDayEnd = saleStart + 2 days;
  uint256 public constant saleEnd = 1514304000;
  
  uint256 public constant NITRO_TEAM_UNFREEZE_DATE = saleEnd + 182 days;

}