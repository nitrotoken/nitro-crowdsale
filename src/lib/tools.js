'use strict';
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

const tokensSold = () =>
  token.balanceOf(ethCrowsale)
    .then(wei2big)
    .then(tokenStat.total.sub.bind(tokenStat.total));

module.exports = {
  btc2big,
  wei2big,
  tokensSold
}