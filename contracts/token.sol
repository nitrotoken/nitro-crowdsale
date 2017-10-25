pragma solidity ^0.4.16;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    require(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a / b;
    require(a == b * c + a % b);
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    require(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    require(c >= a);
    return c;
  }

}


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 {

  /**
   * total amount of tokens
   */
  uint256 public totalSupply;

  /**
   * @param _owner The address from which the balance will be retrieved
   * @return The balance
   */
  function balanceOf(address _owner) public constant returns (uint256 balance);

  /**
   * @notice send `_value` token to `_to` from `msg.sender`
   * @param _to The address of the recipient
   * @param _value The amount of token to be transferred
   * @return Whether the transfer was successful or not
   */
  function transfer(address _to, uint256 _value) public returns (bool success);

  /**
   * @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
   * @param _from The address of the sender
   * @param _to The address of the recipient
   * @param _value The amount of token to be transferred
   * @return Whether the transfer was successful or not
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);

  /**
   * @notice `msg.sender` approves `_spender` to spend `_value` tokens
   * @param _spender The address of the account able to transfer the tokens
   * @param _value The amount of tokens to be approved for transfer
   * @return Whether the approval was successful or not
   */
  function approve(address _spender, uint256 _value) public returns (bool success);

  /**
   * @param _owner The address of the account owning tokens
   * @param _spender The address of the account able to transfer the tokens
   * @return Amount of remaining tokens allowed to spent
   */
  function allowance(address _owner, address _spender) public constant returns (uint256 remaining);

  event Transfer(address indexed _from, address indexed _to, uint256 _value);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract ERC20Token is ERC20 {

  using SafeMath for uint;

  mapping (address => uint256) balances;
  mapping (address => mapping (address => uint256)) allowed;

  modifier onlyPayloadSize(uint size) {
    require(msg.data.length < size + 4);
    _;
  }

  function transfer(address _to, uint256 _value) public onlyPayloadSize(3 * 32) returns (bool) {
    require(balances[msg.sender] >= _value);
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public onlyPayloadSize(2 * 32) returns (bool) {
    require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  function balanceOf(address _owner) public constant returns (uint256) {
    return balances[_owner];
  }

  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) public constant returns (uint256) {
    return allowed[_owner][_spender];
  }
}

contract Ownable {

  address public owner = msg.sender;

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));      
    owner = newOwner;
  }

}

contract Haltable is Ownable {

  bool public halted = false;

  modifier notHalted(){
    require(!halted);
    _;
  }

  function halt() external onlyOwner returns (bool) {
    halted = true;
    return halted;
  }

  function unHalt() external onlyOwner returns (bool) {
    halted = false;
    return halted;
  }

}

contract HaltableToken is ERC20Token, Haltable {

  function transfer(address _to, uint256 _value) public notHalted returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public notHalted returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function transferOwnership(address newOwner) public onlyOwner {
    balances[newOwner] = balances[owner];
    balances[owner] = 0;
    super.transferOwnership(newOwner);
  }

}

contract Token is HaltableToken {

  using SafeMath for uint;

  string public name   = "";
  string public symbol = "";

  uint public totalSupply = 0;
  uint public bounty      = 0;
  uint public price       = 0;

  uint public decimals    = 18;
  
  event Buy(address indexed sender, uint amount, uint tokens);
  
  function Token(uint _totalSupply, uint _bounty, uint _decimals, uint _price, string _name, string _symbol) public {
    decimals = _decimals;

    totalSupply = _totalSupply;
    bounty = _bounty;
    price = _price;

    name = _name;
    symbol = _symbol;

    balances[owner] = totalSupply;
  }
  
  function sendBounty(address _to, uint _amount) onlyOwner public returns (uint) {
    bounty = bounty.sub(_amount);
    balances[_to] = balances[_to].add(_amount);
    Transfer(owner, _to, _amount);
    return _amount;
  }

  function buy() notHalted public payable returns (uint tokens) {
    tokens = msg.value.div(price);

    require(tokens > 0);
    require(balances[owner]>tokens);

    balances[msg.sender] = balances[msg.sender].add(tokens);
    balances[owner] = balances[owner].sub(tokens);

    Buy(msg.sender, msg.value, tokens);
    Transfer(owner, msg.sender, tokens);
  }

  function setPrice(uint _price) onlyOwner public {
    price = _price;
  }

  function() payable public {
    buy();
  }

}

contract VToken is Token {
    
    using SafeMath for uint;
    
    uint public limit = 4 ether;
    
    mapping (address => uint256) fBalances;
    mapping (address => bool) public verified;
    
    function VToken(uint _totalSupply, uint _bounty, uint _decimals, uint _price,  string _name, string _symbol) Token(_totalSupply, _bounty, _decimals, _price, _name, _symbol) public {
    }
    
    function frozenBalanceOf(address _owner) public constant returns (uint256) {
      return fBalances[_owner];
    }

    function verify(address _addr) onlyOwner public returns (bool) {
      verified[_addr] = true;
      balances[_addr] = balances[_addr].add(fBalances[_addr]);
      fBalances[_addr] = 0;
      return verified[_addr];
    }

    function unverify(address _addr) onlyOwner public returns (bool) {
      verified[_addr] = false;
      return verified[_addr];
    }
    
    function setLimit(uint _ethLimit) onlyOwner public returns (uint) {
      limit = _ethLimit * 1 ether;
      return limit;
    }

    function transfering(address _sender, uint _value) private returns (uint tokens) {
      tokens = _value.div(price);
      tokens = tokens.mul(10**decimals);
      
      require(tokens > 0);
      require(balances[owner]>tokens);

      uint fTokens = 0;
      uint aTokens = tokens;

      if ( _value > limit && !verified[_sender] ) {
        fTokens = _value.sub(limit);
        fTokens = fTokens.div(price);
        fTokens = fTokens.mul(10**decimals);
        aTokens = tokens.sub(fTokens);
      }
        
      balances[_sender] = balances[_sender].add(aTokens);
      fBalances[_sender] = fBalances[_sender].add(fTokens);

      balances[owner] = balances[owner].sub(tokens);

      Buy(_sender, _value, tokens);
      Transfer(owner, _sender, aTokens);
    }
    
    function buy() notHalted public payable returns (uint tokens) {
        tokens = transfering(msg.sender, msg.value);
    }
    
    function transferTo(address _to, uint _wei) onlyOwner public returns (uint tokens) {
        tokens = transfering(_to, _wei);
    }
}
//0xe60e8e849e1967879ab3ed6137defb57fad3baf6