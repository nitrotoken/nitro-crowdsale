const web3 = require('./ethereum');
const account = require('./account');

const address = require('../config').ethCrowsale;
const abi = require('../config/abi/crowdsale.json');

const CallerFactory = require('../lib/utils').ContractCallerFactory;

const contract = new web3.eth.Contract(abi, address);
const methods = contract.methods;
const Caller = CallerFactory(web3)(contract, address, account);


Object.assign(exports, {

  wallet(){
    return methods.wallet().call();
  },

  rate(){
    return methods.rate().call();
  },

  weiLimit(){
    return methods.weiLimit().call();
  },

  satLimit(){
    return methods.satLimit().call();
  },

  weiRaised(){
    return methods.weiRaised().call();
  },

  satRaised(){
    return methods.satRaised().call();
  },

  isVerified(addr){
    return methods.isVerified(addr).call();
  },

  verify(addr){
    return Caller('verify', addr);
  },

  getWeiTokensOwed(addr){
    return methods.getWeiTokensOwed(addr).call();
  },

  getSatTokensOwed(addr){
    return methods.getSatTokensOwed(addr).call();
  },

  owedTokens(addr){
    return methods.owedTokens(addr).call();
  },

  getSatOwed(addr){
    return methods.getSatOwed(addr).call();
  },

  getWeiOwed(addr){
    return methods.getSatOwed(addr).call();
  },

  buyForBtc(addr, sat, satOwed, wei, weiOwed){
    return Caller('buyForBtc', addr, sat, satOwed, wei, weiOwed);
  },

  refundWei(addr, amount){
    return Caller('refundWei', addr, amount);
  },

  refundedSat(addr){
    return Caller('refundedSat', addr);
  }

})