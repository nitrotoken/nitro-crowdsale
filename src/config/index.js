'use strict';
const BigNumber = require('bignumber.js');

const {
  MONGO_URI = '',
  HOST_URI = 'localhost:8080',

  REDIS_PORT = undefined,
  REDIS_HOST = undefined,
  REDIS_PASS = undefined,

  ETHERSCAN_KEY = '',

  BTC_ADDRESS_COMPANY = '',
  ETH_ADDRESS_CROWDSALE = '',
  ETH_ADDRESS_TOKEN = '',

  ETH_CONTRACT_OWNER = '',

  BITCORE_RPC = '',
  ETHEREUM_RPC = '',
 
  NODE_ENV = 'development'
} = process.env;

module.exports = {
  env: NODE_ENV,

  hostUri: HOST_URI,
  mongoUri: MONGO_URI,

  network: {
    bitcoin: ({
      'production': 'livenet',
      'development': 'testnet'
    }[NODE_ENV]),

    ethereum: ({
      'production': 'mainnet',
      'development': 'ropsten'
    }[NODE_ENV]),
  },

  etherscanKey: ETHERSCAN_KEY,
  
  btcAddress: BTC_ADDRESS_COMPANY,
  ethCrowsale: ETH_ADDRESS_CROWDSALE,
  ethToken: ETH_ADDRESS_TOKEN,
  
  contractOwner: ETH_CONTRACT_OWNER,
  
  bitcoinRpc: BITCORE_RPC,
  ethereumRpc: ETHEREUM_RPC,

  tokenStat:{
    total: new BigNumber('120000000'),
    privateSaleEth: 5584,  
  },
  
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    auth: REDIS_PASS
  }
}