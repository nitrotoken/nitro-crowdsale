const Web3 = require('web3');

const { compose } = require('../lib/utils');
const config = require('../config');

module.exports = compose(
  url => new Web3.providers.HttpProvider(url),
  provider => new Web3(provider)
)(config.ethereumRpc);
