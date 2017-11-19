const web3 = require('./ethereum');
const pkey = require('../config').contractOwner;

module.exports = web3.eth.accounts.privateKeyToAccount(pkey);