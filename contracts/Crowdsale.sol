pragma solidity ^0.4.16;

import './lib/SafeMath.sol';
import './lib/Ownable.sol';

import './NitroToken.sol';

contract Crowdsale is Ownable {

    using SafeMath for uint256;

    struct History {
        uint weiAmount;
        uint satoshiAmount;
        uint tokens;
        uint rate;
        uint timestamp;
        /**
         * 0 - funding
         * 1 - unfreeze
         * 2 - refund frozen
         * 3 - refund bitcoin
         * 4 - send token
         **/
        uint8 txtype;
        /**
         * 0 - ethereum
         * 1 - bitcoin
         * 2 - unfreeze
         */
        uint8 network;
    }
    
    //Token
    NitroToken public token;
    
    //address where funds are collected
    address public wallet;
    
    //funding history
    mapping(address => History[]) public history;
    
    //verified users
    mapping(address => bool) public verified;
    
    //frozen balance for unverified users
    mapping(address => uint) public frozen;
    
    //wei limit for unverified users
    uint public limit = 6.69 * 1 ether;
    
    //amount of raised money in wei
    uint public weiRaised;
    
    //amount of raised money in satoshi
    uint public satoshiRaised;
    
    uint public decimals = 18;
    
    uint public preSaleStart = now;
    uint public preSaleEnd = now + 1 minutes;
    uint public preSaleRate = 1040;
    uint public preSaleMinValue = 5 ether;
    
    uint public saleStart = now + 2 minutes;
    uint public saleEnd = now + 3 minutes;
    uint public saleRate = 800;
    
    uint public totalSupply = 6 * 10**25;
    uint public reserve = 6 * 10**25;
    
    modifier onlyOwnerOrWallet() {
        require(msg.sender == owner || msg.sender == wallet);
        _;
    }
    
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
    
    //creates the token to be sold
    function createTokenContract() internal returns (NitroToken) {
        return new NitroToken();
    }
    
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
    
    function minting(address _sender, uint _value) private returns (uint){
        require( (now>=preSaleStart && now<=preSaleEnd) || (now>=saleStart && now<=saleEnd) );
        if (now>=preSaleStart && now<=preSaleEnd) {
            require(_value >= preSaleMinValue);
        }
        
        uint value = _value;
        
        if(frozen[_sender]>0){
            frozen[_sender] = frozen[_sender].add(value);
            value = 0;
        }
        
        if(_value > limit && !verified[_sender]){
            frozen[_sender] = frozen[_sender].add(value.sub(limit));
            value = limit;
        }
        
        uint tokens = value.mul(rate());
        
        if(tokens > 0){
            totalSupply = totalSupply.sub(tokens);
            token.mint(_sender, tokens);
            TokenPurchase(_sender, _sender, value, tokens);
        }
        
        return tokens;
    }
    
    function buy() public payable returns (uint){
        uint tokens = minting(msg.sender, msg.value);
        weiRaised = weiRaised.add(msg.value);
        history[msg.sender].push(History(msg.value, 0, tokens, rate(), now, 0, 0));
        return tokens;
    }
    
    function () public payable {
        buy();
    }
    
    function fromBitcoin(address _sender, uint _satoshiAmount, uint _weiAmount) onlyOwnerOrWallet public returns (uint) {
        uint tokens = minting(_sender, _weiAmount);
        satoshiRaised = satoshiRaised.add(_satoshiAmount);
        history[_sender].push(History(_weiAmount, _satoshiAmount, tokens, rate(), now, 0, 1));
        return tokens;
    }

    function reserveSendToWallet(address _addr, uint _tokens) onlyOwnerOrWallet public {
        uint tokens = _tokens.mul(10**18);
        reserve = reserve.sub(tokens);
        
        token.mint(_addr, tokens);
        TokenPurchase(_addr, _addr, 0, tokens);
        
        history[_addr].push(History(0, 0, tokens, 0, now, 4, 0));
    }
    
    function reserveToTotalSupply(uint _tokens) onlyOwnerOrWallet public {
        uint tokens = _tokens.mul(10**18);
        
        reserve = reserve.sub(tokens);
        totalSupply = totalSupply.add(tokens);
    }

    function balanceOf(address _addr) public constant returns (uint){
        return token.balanceOf(_addr);
    }
    
    function withdraw(uint value) onlyOwnerOrWallet public {
        require(msg.sender==owner || msg.sender==wallet);
        wallet.transfer(value);
    }

    function destroy() onlyOwner public {
        selfdestruct(wallet);
    }
    
    function setTokenOwner(address _addr) onlyOwnerOrWallet public {
        token.transferOwnership(_addr);
    }
    
    function setLimit(uint _limit) onlyOwnerOrWallet public {
        limit = _limit;
    }
    
    function verify(address _addr) onlyOwnerOrWallet public returns (uint) {
        verified[_addr] = true;
    
        uint value = frozen[_addr];
        frozen[_addr] = 0;
        
        uint tokens = value.mul(rate());
        if (tokens == 0) {
            return 0;
        }
        
        token.mint(_addr, tokens);
        TokenPurchase(_addr, _addr, value, tokens);
        
        history[_addr].push(History(value, 0, tokens, rate(), now, 1, 2));

        return tokens;
    }
    
    function refundFrozen(address _addr) onlyOwnerOrWallet public {
        uint value = frozen[_addr];
        weiRaised = weiRaised.sub(value);
        frozen[_addr] = 0;
        history[msg.sender].push(History(value, 0, 0, 0, now, 2, 0));
        _addr.transfer(value); 
    }
    
    function historyLen(address _addr) public constant returns (uint) {
        return history[_addr].length;
    }
    
    function addHistory(
        address _addr,
        uint _wei,
        uint _sat,
        uint _tokens,
        uint _rate,
        uint8 _type,
        uint8 _net
    ) onlyOwnerOrWallet public{
        history[_addr].push(History(_wei, _sat, _tokens, _rate, now, _type, _net));
    }
}