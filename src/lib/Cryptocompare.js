const URL = require('url').URL;
const fetch = require('./utils.js').fetch;

module.exports = class Cryptocompare{

  static get host(){
    return new URL('https://min-api.cryptocompare.com/data/');
  }

  static price(fsym='ETH', tsyms='BTC,USD,EUR'){
    let url = Cryptocompare.host;
    url.pathname += 'price';
    url.searchParams.append('fsym', fsym);
    url.searchParams.append('tsyms', tsyms);

    return fetch(url.toString())
      .then(data => ({
        btc: data.BTC,
        usd: data.USD,
        eur: data.EUR
      }));
  }

}