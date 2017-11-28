pragma solidity ^0.4.18;

import './Declaration.sol';

contract Crowdsale is Declaration, Ownable{
    
    using SafeMath for uint256;

    address public wallet;
    
    uint256 public weiLimit = 6 ether;
    uint256 public satLimit = 30000000;

    mapping(address => bool) users;
    mapping(address => uint256) weiOwed;
    mapping(address => uint256) satOwed;
    mapping(address => uint256) weiTokensOwed;
    mapping(address => uint256) satTokensOwed;
    
    uint256 public weiRaised;
    uint256 public satRaised;

    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    
    function Crowdsale(address _wallet) Declaration public {
        wallet = _wallet;    
    }
    
    function () public payable {
        buy();
    }

    function weiFreeze(address _addr, uint256 _value) internal {
        uint256 amount = _value * rate();
        balances[0] = balances[0].sub(amount);
        weiOwed[_addr] += _value;
        weiTokensOwed[_addr] += amount;
    }

    function weiTransfer(address _addr, uint256 _value) internal {
        uint256 amount = _value * rate();
        balances[0] = balances[0].sub(amount);
        token.transfer(_addr, amount);
        weiRaised += _value;
        TokenPurchase(_addr, _addr, _value, amount);
    }

    function buy() withinPeriod public payable returns (bool){
        if (isPresale()) {
          require(msg.value >= presaleMinValue);
        }else{
          require(msg.value > 0);
        }
        if (weiOwed[msg.sender]>0) {
          weiFreeze(msg.sender, msg.value);
        } else if (msg.value>weiLimit && !users[msg.sender]) {
          weiFreeze(msg.sender, msg.value.sub(weiLimit));
          weiTransfer(msg.sender, weiLimit);
        } else {
          weiTransfer(msg.sender, msg.value);
        }
        return true;
    }
    
    function _verify(address _addr) onlyOwner internal {
        users[_addr] = true;
        
        weiRaised += weiOwed[_addr];
        satRaised += satOwed[_addr];

        token.transfer(_addr, weiTokensOwed[_addr] + satTokensOwed[_addr]);
        
        TokenPurchase(_addr, _addr, 0, weiTokensOwed[_addr] + satTokensOwed[_addr]);

        weiOwed[_addr]=0;
        satOwed[_addr]=0;
        weiTokensOwed[_addr]=0;
        satTokensOwed[_addr]=0;
    }

    function verify(address _addr) public returns(bool){
        _verify(_addr);
        return true;
    }
    
    function isVerified(address _addr) public constant returns(bool){
      return users[_addr];
    }
    
    function getWeiTokensOwed(address _addr) public constant returns (uint256){
        return weiTokensOwed[_addr];
    }

    function getSatTokensOwed(address _addr) public constant returns (uint256){
        return satTokensOwed[_addr];
    }

    function owedTokens(address _addr) public constant returns (uint256){
        return weiTokensOwed[_addr] + satTokensOwed[_addr];
    }
    
    function getSatOwed(address _addr) public constant returns (uint256){
        return satOwed[_addr];
    }
    
    function getWeiOwed(address _addr) public constant returns (uint256){
        return weiOwed[_addr];
    }
    
    function satFreeze(address _addr, uint256 _wei, uint _sat) private {
        uint256 amount = _wei * rate();
        balances[0] = balances[0].sub(amount);
        
        satOwed[_addr] += _sat;
        satTokensOwed[_addr] += amount;    
    }

    function satTransfer(address _addr, uint256 _wei, uint _sat) private {
        uint256 amount = _wei * rate();
        balances[0] = balances[0].sub(amount);
        
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
    
    function refundWei(address _addr, uint256 _amount) onlyOwner public returns (bool){
        _addr.transfer(_amount);
        balances[0] += weiTokensOwed[_addr];
        weiTokensOwed[_addr] = 0;
        weiOwed[_addr] = 0;
        return true;
    }
  
    function refundedSat(address _addr) onlyOwner public returns (bool){
        balances[0] += satTokensOwed[_addr];
        satTokensOwed[_addr] = 0;
        satOwed[_addr] = 0;
        return true;
    }
    
    function sendOtherTokens(
        uint8 _index,
        address _addr,
        uint256 _amount
    ) onlyOwner public {
        require(_addr!=address(0));

        if (_index==uint8(TokenTypes.team) && now<teamUnfreezeDate) {
            uint256 limit = balances[uint8(TokenTypes.team)].sub(teamFrozenTokens);
            require(_amount<=limit);
        }
        
        token.transfer(_addr, _amount);
        balances[_index] = balances[_index].sub(_amount);
        TokenPurchase(owner, _addr, 0, _amount);
    }
    
    function rsrvToSale(uint256 _amount) onlyOwner public {
        balances[uint8(TokenTypes.reserve)] = balances[uint8(TokenTypes.reserve)].sub(_amount);
        balances[0] += _amount;
    }
    
    function forwardFunds(uint256 amount) onlyOwner public {
        wallet.transfer(amount);
    }
    
    function setTokenOwner(address _addr) onlyOwner public {
        token.transferOwnership(_addr);
    }

}