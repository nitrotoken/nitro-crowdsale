pragma solidity ^0.4.16;

import './lib/SafeMath.sol';
import './lib/Ownable.sol';

import './NitroToken.sol';

contract Crowdsale is Ownable {

  using SafeMath for uint256;

  //Token
  NitroToken public token;

  /**
   * uint[][0]:uint[][1] - Crowdsale period
   * uint[][2] - price for 1 token
   * uint[][3] - minimum condition for msg.value
   */
  uint[][3] prices;

  //address where funds are collected
  address public wallet;

  //amount of raised money in wei
  uint public weiRaised;

  //amount of raised money in satoshi
  uint public satoshiRaised;

  //verified users
  mapping(address => bool) public verified;

  //frozen balance for unverified users
  mapping(address => uint) public frozen;

  //wei limit for unverified users
  uint public limit;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function Crowdsale(uint[][3] _prices, address _wallet, uint _limit) public {
    require(_wallet != address(0));

    bool datesIsValid = true;
    uint lastDate = now;
    for (uint i = 0; i<_prices.length && datesIsValid; i++) {
      datesIsValid = lastDate<=_prices[i][0] && _prices[i][0] <= _prices[i][1] && _prices[i][2]>0;
      lastDate = _prices[i][1];
    }
    require(datesIsValid);

    prices = _prices;
    token = createTokenContract();
    wallet = _wallet;
    limit = _limit;
  }

  //creates the token to be sold
  function createTokenContract() internal returns (NitroToken) {
    return new NitroToken();
  }

  function price() public constant returns (uint prc, uint min) {
    bool found = false;
    for (uint i = 0; !found && i<prices.length; i++) {
      found = prices[i][0]>=now && now<=prices[i][1];
      prc = prices[i][2];
      min = prices[i][3];
    }
    require(found);
  }
  
  function buy() public payable returns (uint) {
    uint prc;
    uint min;
    (prc, min) = price();
    require(msg.value >= min);

    return minting(msg.sender, msg.value, prc);
  }

  function () public payable {
    buy();
  }

  function fromBitcoin(address _sender, uint _weiAmount) onlyOwner public returns (uint){
    uint prc;
    uint min;
    (prc, min) = price();
    
    return minting(_sender, _weiAmount, prc);
  }

  function minting(address _sender, uint _value, uint _price) private returns (uint){
    uint weiAmount = _value;
    if (!verified[_sender] && _value > limit) {
      frozen[_sender] = _value.sub(limit);
      weiAmount = limit;
    }
    uint tokens = weiAmount.mul(token.multiplier).div(_price);

    if (tokens > 0) {
      token.mint(_sender, tokens);
      TokenPurchase(_sender, _sender, weiAmount, tokens);
    }

    return tokens;
  }

  function refundFrozen(address _addr) onlyOwner public {
    uint value = frozen[_addr];
    frozen[_addr] = 0;

    _addr.transfer(value); 
  }

  function verify(address _addr) onlyOwner public returns (uint) {
    verified[_addr] = true;
    
    uint value = frozen[_addr];
    frozen[_addr] = 0;

    uint tokens = 0;
    if (value > 0) {
      uint prc;
      uint min;
      (prc, min) = price();      
      tokens = minting(_addr, value, prc);
    }

    return tokens;
  }

  function unverify(address _addr) onlyOwner public {
    verified[_addr] = false;
  }

  function setLimit(uint _limit) onlyOwner public {
    limit = _limit;
  }

  function setTokenOwner(address _addr) onlyOwner public {
    token.transferOwnership(_addr);
  }

  function withdraw(uint value) public {
    require(msg.sender==owner || msg.sender==wallet);
    wallet.transfer(value);
  }

  function destroy() onlyOwner public {
    selfdestruct(wallet);
  }

}