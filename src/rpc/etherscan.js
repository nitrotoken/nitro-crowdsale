const Etherscan = require('etherscan-api');

const {
  etherscanKey,
  network:{
    ethereum
  }
} = require('../config');

module.exports = Etherscan.init(
  etherscanKey,
  (ethereum!=='mainnet')
    ? ethereum
    : undefined
);