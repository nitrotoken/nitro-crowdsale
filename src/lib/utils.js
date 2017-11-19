'use strict';

const Fetch = require('node-fetch');
const web3 = require('../rpc/ethereum');
const etherscan = require('../rpc/etherscan');

/**
 * Promisify callback function
 * @param {Function} action
 * @return {Function}
 */
const promisify =
(action) =>
  (...args) =>
    new Promise((resolve, reject) => action.call(null, ...args, (error, ...other) => {
      if (error) {
        reject(error);
      } else {
        resolve(...other);
      }
    }));

/**
* Returns a curried equivalent of the provided function
* @params {Function} func
* @params {...any} params
* @return {Function}
*/
const curry =
(func, ...params) =>
  (...args) =>
    func.apply(null, [...params, ...args]);

/**
* Return composed result
* @param {...Function} functions
*/
const compose =
(...functions) =>
  (...args) =>
    functions
      .slice(1)
      .reduce(
        (x, f) => f(x),
        functions[0](...args)
      );

/**
* Return composed result for "promisified" functions
* @param {...Function} functions
*/
const pcompose =
(...functions) =>
  (...args) =>
    functions
      .slice(1)
      .reduce(
        async (x, f) => f(await x),
        functions[0](...args)
      );

/**
 * Fetch url and get json
 * @param {...Object} args 
 */
const fetch =
(...args) =>
  Fetch(...args)
    .then(
      res =>
        res.json()
    );
   
/**
 * 
 * @param {*} web3 
 */
const ContractCallerFactory =
(web3) =>
  (contract, contractAddress, account) =>
    (methodName, ...args) => {
      const method = contract.methods[methodName](...args);    
      return method
        .estimateGas()
        .then(gas => account.signTransaction({
          to: contractAddress,
          gasLimit: gas,
          data: method.encodeABI()
        }))
      .then(
        ({rawTransaction}) =>
          //etherscan.proxy.eth_sendRawTransaction(rawTransaction)
          web3.eth.sendSignedTransaction(rawTransaction)
      );
  };

/**
 * @param {*} address 
 */
const isAddress =
(address) =>
  (web3.utils.isAddress(address))
    ? Promise.resolve(address)
    : Promise.reject(new Error('not valid address'));

const holedrsCount =
() =>
  Fetch('https://etherscan.io/token/generic-tokenholders2?a=0xec46f8207d766012454c408de210bcbc2243e71c')
    .then( res => res.text() )
    .then( text => text.match(/total of (.*) Token Holders/g)[0].match(/[\d]+/g)[0] ); 

module.exports = {
  promisify,
  curry,
  compose,
  pcompose,
  fetch,
  ContractCallerFactory,
  isAddress,
  holedrsCount
};