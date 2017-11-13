pragma solidity ^0.4.16;

import './lib/SafeMath.sol';
import './lib/Ownable.sol';

import './NitroToken.sol';

contract Crowdsale is Ownable {
    
  using SafeMath for uint;
  
  enum Network { btc, eth }
  
  struct Freeze {
    Network net;

    uint frozen;
    
    uint weis;
    uint sats;

    uint tokens;
  }
  
  mapping(address => Freeze[]) public frozen;
  mapping(address => bool) public verified;
  
  
  //address where funds are collected
  address public wallet;
  
  uint public constant preSaleStart = 1513285200000;
  uint public constant preSaleEnd = 1513976399000;
  uint public constant preSaleRate = 1040;
  uint public constant preSaleMinValue = 5 ether;
    
  uint public constant saleStart = 1514322000000;
  uint public constant saleEnd = 1517000399000;
  uint public constant saleRate = 800;
  
  uint public constant nitroTeamUnfreezeDate = saleEnd + 182 days;
  
  uint public crowdsaleTokens = 60000000 * 10**18;
  uint public interactiveTokens = 6000000 * 10**18;
  uint public iCandyTokens = 3000000 * 10**18;
  uint public consultantTokens = 1200000 * 10**18;
  uint public reservedTokens = 42600000 * 10**18;
  uint public nitroTeamTokens = 7200000 * 10**18;
  
  uint public nitroTeamFrozenTokens = 4800000 *10**18;
  
  uint public limit = 7 ether;
  
  uint public weiRaised = 0;
  uint public satRaised = 0;
  
  bool public finished = false;

  //Token
  NitroToken public token;
  
  event Finished();
  event Verified(address indexed beneficiary);
  event ReservedToWallet(address indexed addr, uint value);
  event ReservedToCrowdsale(uint value);
  
  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  
  function Crowdsale(address _wallet) public {
    require(_wallet != address(0));
    wallet = _wallet;
    token = createTokenContract();
  }
  
  function createTokenContract() internal returns (NitroToken) {
    return new NitroToken(crowdsaleTokens+interactiveTokens+iCandyTokens+consultantTokens+reservedTokens+nitroTeamTokens);
  }

  /**
   * @return how many token units a buyer gets per wei
   */
  function rate() public constant returns (uint){
    if (now>=preSaleStart && now<=preSaleEnd) {
      return preSaleRate;
    }
    if (now>=saleStart && now<=(saleStart + 1 minutes)){
      return saleRate.add(saleRate.div(4));
    }
    if (now>(saleStart + 1 minutes) && now<=(saleStart + 2 minutes)){
      return saleRate.add(saleRate.mul(3).div(20));
    }
    return saleRate;
  }
  
  /**
   * @return true if the transaction can buy tokens
   */
  function validPurchase(uint _value) internal constant returns (bool) {
    bool isPresale = now >= preSaleStart && now <= preSaleEnd;
    bool isSale = now >= saleStart && now <= saleEnd;
    bool withinPeriod = isPresale || isSale;

    bool nonZeroPurchase = _value != 0;
    
    return !finished && withinPeriod && nonZeroPurchase;
  }

  function satRaisedAdd(uint _value) onlyOwner public{
    satRaised = satRaised.add(_value);
  }

  function satRaisedSub(uint _value) onlyOwner public{
    satRaised = satRaised.sub(_value);
  }
  
  function finish() onlyOwner public {
    finished = true;
    token.unhalt();
    Finished();
  }
 
  function destroy() onlyOwner public{
    selfdestruct(wallet);
  }
  
  function interactiveTokensToAddr(address _addr, uint _tokens) onlyOwner public {
    require(_addr!=address(0));
    
    uint tokens = _tokens.mul(10**18);
    interactiveTokens = interactiveTokens.sub(tokens);
    
    token.transfer(_addr, tokens);
  }
  
  function iCandyTokensToAddr(address _addr, uint _tokens) onlyOwner public {
    require(_addr!=address(0));
    
    uint tokens = _tokens.mul(10**18);
    iCandyTokens = iCandyTokens.sub(tokens);
    
    token.transfer(_addr, tokens);
  }
  
  function consultantTokensToAddr(address _addr, uint _tokens) onlyOwner public {
    require(_addr!=address(0));
    
    uint tokens = _tokens.mul(10**18);
    consultantTokens = consultantTokens.sub(tokens);
    
    token.transfer(_addr, tokens);
  }
  
  function nitroTeamTokensToAddr(address _addr, uint _tokens) onlyOwner public {
    require(_addr!=address(0));
    
    uint tokens = _tokens.mul(10**18);
    
    if(now<nitroTeamUnfreezeDate){
      require(tokens<=nitroTeamTokens.sub(nitroTeamFrozenTokens));
    }
    nitroTeamTokens = nitroTeamTokens.sub(tokens);
    
    token.transfer(_addr, tokens);
  }
  
  function reserveTokensSendToAddr(address _addr, uint _tokens) onlyOwner public {
    require(_addr!=address(0));

    uint tokens = _tokens.mul(10**18);
    reservedTokens = reservedTokens.sub(tokens);
    
    token.transfer(_addr, tokens);
    TokenPurchase(owner, _addr, 0, tokens);
    ReservedToWallet(_addr, tokens);
  }
  
  function reservedTokensToCrowdsaleTokens(uint _tokens) onlyOwner public {
    uint tokens = _tokens.mul(10**18);
    reservedTokens = reservedTokens.sub(tokens);
    crowdsaleTokens = crowdsaleTokens.add(tokens);
    ReservedToCrowdsale(tokens);
  }

  function withdrawFunds(uint _value) onlyOwner public {
    wallet.transfer(_value);
  }
  
  function frozenLen(address _addr) public constant returns (uint){
    return frozen[_addr].length;
  }

  function verify(address _addr) onlyOwner public {
    verified[_addr] = true;
    
    uint tokens = 0;

    for (uint i = 0; i<frozen[_addr].length; i++) {
      tokens = tokens.add(frozen[_addr][i].tokens);
      if(frozen[_addr][i].net==Network.eth){
        weiRaised = weiRaised.add(frozen[_addr][i].frozen);
      }
    }
    
    if(tokens>0){
      token.transfer(_addr, tokens);
      delete frozen[_addr];
    }
    
    Verified(_addr);
  }
  
  function buyForEth() public payable {
    require(validPurchase(msg.value));
    address sender = msg.sender;
    uint value = msg.value;
    uint rrate = rate();
    
    if(frozen[sender].length>0){
      frozen[sender].push(Freeze(
        Network.eth,
        value,
        value,
        0,
        value.mul(rrate)
      ));
      value = 0;
    } else if(value > limit && !verified[msg.sender]){
      frozen[sender].push(Freeze(
        Network.eth,
        value.sub(limit),
        value,
        0,
        value.sub(limit).mul(rrate)
      ));
      value = limit;
    }
    
    uint tokens = value.mul(rrate);
    
    if(tokens > 0){
      token.transfer(sender, tokens);
      weiRaised = weiRaised.add(value);
      TokenPurchase(sender, sender, value, tokens);
    }
  }
  
  function () public payable {
    buyForEth();
  }
  
  function buyForBtc(address _addr, uint _sat, uint _wei) onlyOwner public {
    require(validPurchase(_wei));
    
    address sender = _addr;
    uint value = _wei;
    uint rrate = rate();
    
    if(frozen[sender].length>0){
      frozen[sender].push(Freeze(
        Network.btc,
        value,
        value,
        _sat,
        value.mul(rrate)
      ));
      value = 0;
    }else if(value > limit && !verified[msg.sender]){
      frozen[sender].push(Freeze(
        Network.btc,
        value.sub(limit),
        value,
        _sat,
        value.sub(limit).mul(rrate)
      ));
      value = limit;  
    }
    
    uint tokens = value.mul(rrate);
    if(tokens > 0){
      token.transfer(sender, tokens);
      satRaised = satRaised.add(_sat);
      TokenPurchase(sender, sender, value, tokens);
    }
  }
  
  function refundFrozen(address _addr, uint index) onlyOwner public {
    require(_addr != address(0));

    Network net = frozen[_addr][index].net;
    if(net == Network.eth){
      _addr.transfer(frozen[_addr][index].frozen);
    }else if(net == Network.btc) {
      satRaised = satRaised.sub(frozen[_addr][index].sats);
    }

    delete frozen[_addr][index];
  }

  function setTokenOwner(address _addr) onlyOwner public {
    token.transferOwnership(_addr);
  }

}