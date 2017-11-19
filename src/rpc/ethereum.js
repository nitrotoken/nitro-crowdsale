const Web3 = require('web3');

const url = require('../config').ethereumRpc;
const provider = new Web3.providers.HttpProvider(url);
const web3 = new Web3(provider);

module.exports = web3;