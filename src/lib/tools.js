'use strict';

const Fetch = require('node-fetch');
const BigNumber = require('bignumber.js');

const tokenStat = require('../config').tokenStat;
const ethCrowsale = require('../config').ethCrowsale;

const compose = require('./utils').compose;
const web3 = require('../rpc/ethereum');
const crowdsale = require('../rpc/crowdsale');

const token = require('../rpc/token');
const toBitcoin = require('satoshi-bitcoin').toBitcoin;
const fromWei = web3.utils.fromWei;

const btc2big = compose(
  toBitcoin,
  btc => new BigNumber(btc)
);

const wei2big = compose(
  fromWei,
  eth => new BigNumber(eth)
);

const tokensSold =
() =>
  token.balanceOf(ethCrowsale)
    .then(wei2big)
    .then(tokenStat.total.sub.bind(tokenStat.total));

const holedrsCount =
() =>
  Fetch('https://etherscan.io/token/generic-tokenholders2?a=0xec46f8207d766012454c408de210bcbc2243e71c')
    .then( res => res.text() )
    .then( text => text.match(/total of (.*) Token Holders/g)[0].match(/[\d]+/g)[0] ); 
    
module.exports = {
  btc2big,
  wei2big,
  tokensSold,
  holedrsCount
}