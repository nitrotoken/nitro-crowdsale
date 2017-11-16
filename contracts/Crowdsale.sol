pragma solidity ^0.4.18;

import './Declaration.sol';
import './NitroToken.sol';

contract Crowdsale is Declaration, Ownable {
 
  using SafeMath for uint256;
  
  uint256 public weiRaised = 0;
  uint256 public satRaised = 0;

  address public wallet;
  NitroToken public token = new NitroToken(crowdsaleTokens+otherTokensSum());

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  
  function Crowdsale(address _wallet) public {
    wallet = _wallet;
  }
  
  function verify(address addr) onlyOwner public returns (bool) {
    require(addr != address(0));
    verified[addr] = true;
    uint256 amount = weiTokensOwed[addr] + satTokensOwed[addr];
    
    weiRaised += weiOwed[addr];
    satRaised += satOwed[addr];
    token.transfer(addr, amount);
    
    weiOwed[addr] = 0;
    satOwed[addr] = 0;
    
    weiTokensOwed[addr] = 0;
    satTokensOwed[addr] = 0;
    
    return true;
  }
  
  function weiFreeze(address _addr, uint256 _value) private {
    uint256 amount = _value * rate();
    crowdsaleTokens = crowdsaleTokens.sub(amount);
    weiOwed[_addr] += _value;
    weiTokensOwed[_addr] += amount;
  }

  function weiTransfer(address _addr, uint256 _value) private {
    uint256 amount = _value * rate();
    crowdsaleTokens = crowdsaleTokens.sub(amount);
    token.transfer(_addr, amount);
    weiRaised += _value;
    TokenPurchase(_addr, _addr, _value, amount);
  }

  function buy() withinPeriod public payable returns (bool){
    require(msg.value > 0);
    if (isPresale()) {
      require(msg.value >= PRESALE_MIN_VALUE);
    }
    
    if (weiOwed[msg.sender]>0) {
      weiFreeze(msg.sender, msg.value);
    } else if (msg.value>weiLimit && !verified[msg.sender]) {
      weiFreeze(msg.sender, msg.value.sub(weiLimit));
      weiTransfer(msg.sender, weiLimit);
    } else {
      weiTransfer(msg.sender, msg.value);
    }
    return true;
  }
  
  function() public payable {
    buy();
  }
  
  function satFreeze(address _addr, uint256 _wei, uint _sat) private {
    uint256 amount = _wei * rate();
    crowdsaleTokens = crowdsaleTokens.sub(amount);

    satOwed[_addr] += _sat;
    satTokensOwed[_addr] += amount;    
  }

  function satTransfer(address _addr, uint256 _wei, uint _sat) private {
    uint256 amount = _wei * rate();
    crowdsaleTokens = crowdsaleTokens.sub(amount);
    
    token.transfer(_addr, amount);
    TokenPurchase(_addr, _addr, _wei, amount);
    satRaised += _sat;
  }

  function buyForBtc(
    address _addr,
    uint256 _sat,
    uint256 _satOwed,
    uint256 _wei,
    uint256 _weiOwed
  ) onlyOwner withinPeriod public {
    require(_addr != address(0));
    
    satFreeze(_addr, _weiOwed, _satOwed);
    satTransfer(_addr, _wei, _sat);
  }
  
  function refundWei(address _addr) onlyOwner public returns (bool){
    _addr.transfer(weiOwed[_addr]);
    crowdsaleTokens += weiTokensOwed[_addr];
    weiTokensOwed[_addr] = 0;
    weiOwed[_addr] = 0;
    return true;
  }
  
  function refundedSat(address _addr) onlyOwner public returns (bool){
    crowdsaleTokens += satTokensOwed[_addr];
    satTokensOwed[_addr] = 0;
    satOwed[_addr] = 0;
    return true;
  }
  
  function rsrvToSale(uint256 _amount) onlyOwner public {
    uint256 amount = _amount * 1 ether;
    otherTokens[RESERVED_TOKENS_INDEX] = otherTokens[RESERVED_TOKENS_INDEX].sub(amount);
    crowdsaleTokens += amount;
  }
  
  function sendOtherTokens(uint8 _index, address _addr, uint256 _amount) onlyOwner public {
    require(_addr!=address(0));

    uint256 amount = _amount.mul(10**18);
    
    if (_index==NITRO_TEAM_TOKENS_INDEX && now<NITRO_TEAM_UNFREEZE_DATE) {
      uint256 limit = otherTokens[NITRO_TEAM_TOKENS_INDEX].sub(NITRO_TEAM_FROZEN_TOKENS);
      require(amount<=limit);
    }
    
    otherTokens[_index] = otherTokens[_index].sub(amount);
    token.transfer(_addr, amount);
    TokenPurchase(owner, _addr, 0, amount);
  }
  
  function forwardFunds(uint256 amount) onlyOwner public {
    wallet.transfer(amount);
  }

  function setTokenOwner(address _addr) onlyOwner public {
    token.transferOwnership(_addr);
  }
}