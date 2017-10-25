const Poloniex = require('poloniex.js');
const config = require('../config');

const poloniex = new Poloniex(config.poloniexKey, config.poloniexSec);

module.exports = poloniex;