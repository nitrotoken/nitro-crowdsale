const web3 = require('./ethereum');
const account = require('./account');

const address = require('../config').ethToken;
const abi = require('../config/abi/token.json');

const contract = new web3.eth.Contract(abi, address);
const methods = contract.methods;

Object.assign(exports, {

  balanceOf(addr){
    return methods.balanceOf(addr).call();
  }

});