const Bitexplorer = require('../lib/Blockexplorer');
const config = require('../config');

module.exports = new Bitexplorer({
  host: config.bitcoinRpc,
  network: ({
    'production': 'livenet',
    'development': 'testnet'
  }[config.env])
});