'use strict';

const kue = require('kue');

const bitcoin = require('./rpc/bitcoin');
const poloniex = require('./rpc/poloniex');
const contract = require('./rpc/contract');

const {
  toBitcoin
} = require('satoshi-bitcoin');

const promisify = require('./lib/utils').promisify;
const compose = require('./lib/utils').compose;

const get24hVolume = promisify(poloniex.get24hVolume.bind(poloniex))
const opReturnRegexp = /^OP_RETURN\s(.*)$/;

const btc2usd =
  () =>
    get24hVolume()
      .then(({ BTC_ETH: { BTC, ETH } }) => ETH/BTC)

const queue = kue.createQueue();
queue.setMaxListeners(0);

queue.process('tx', 10, (job, done) => {
  Promise.all([
    bitcoin
      .tx(job.data.id),
    btc2usd()
  ]).then(([tx, btc2usd]) => {
    //ToDo: save tx to DB    
    tx.vout.forEach(vout => {
      const text = vout.scriptPubKey.asm
      if(opReturnRegexp.test(text)){
        const hex = text.match(opReturnRegexp)[1];
        const to = new Buffer(hex, 'hex').toString('ascii');
        const value = parseInt(job.data.value * btc2usd);
        queue
          .create('funding', { to, value })
          .save();
      }
    });
    done();
  })
  .catch(console.log);
});

queue.process('funding', 20, (job, done) =>{
  const { to, value } = job.data;
  contract.funding(to, value)
    .then(console.log);
  //ToDo: save tx to DB
});