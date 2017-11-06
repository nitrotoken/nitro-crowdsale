'use strict';
const BigNumber = require('bignumber.js');

const mongoose = require('./config/mongoose');
const Price = require('./models/Price');

const config = require('./config');
const bitcoin = require('./rpc/bitcoin');
const poloniex = require('./rpc/poloniex');
const contract = require('./rpc/contract');

const logger = require('./config/logger')('worker');
const queue = require('./config/queue')();

const toBitcoin = require('satoshi-bitcoin').toBitcoin;

const promisify = require('./lib/utils').promisify;
const compose = require('./lib/utils').compose;

const get24hVolume = promisify(poloniex.get24hVolume.bind(poloniex))
const opReturnRegexp = /^OP_RETURN\s(.*)$/;
const weiInBtc = 10000000000;


function priceUpdateSchedule(timeout = 0){
  const job = queue.create('price')
  !!timeout && job.delay(timeout);
  job.save()
    .on('complete', price => {
      logger.info(`Prices updated: ${price.btc} ${price.usd} ${price.eur}`);
      priceUpdateSchedule(5*60*1000);
    })
    .on('failed', error => {
      logger.error('Prices update error');
      logger.error(error);
      priceUpdateSchedule(5*60*1000);
    });
}

const btc2eth =
  () =>
    get24hVolume()
      .then( ({ BTC_ETH: { BTC, ETH } }) => ETH/BTC );

const tx2OpReturn =
  tx =>
    new Promise((resolve, reject)=> {
      let to = null;
      tx.vout.forEach(vout => {
        const text = vout.scriptPubKey.asm
        if(opReturnRegexp.test(text)){
          const hex = text.match(opReturnRegexp)[1];
          to = new Buffer(hex, 'hex').toString('ascii');
        }
      });
      resolve(to);
    });

function shutdown(error){
  logger.info('turn off');
  !!error && logger.error(error);
  queue.shutdown(5000, err => {
    !!err && logger.error(err);
    logger.info('Kue shutdown');
    process.exit(0);
  });
}

queue.setMaxListeners(0);

queue.process('tx', 10, (job, done) => {
  bitcoin
    .tx(job.data.id)
    .then(tx => {
      //ToDo: save tx to DB;
      return Promise.all([
        tx2OpReturn(tx),
        btc2eth()
      ]);
    })
    .then(([to, x]) => {
      const raw = parseInt(job.data.value) * x * weiInBtc;
      const num = new BigNumber(String(raw));
      const value = num.ceil().toString();
      
      logger.info('TX:', job.data.id);
      logger.info('SAT:', job.data.value);

      logger.info('ADDR:', to);
      logger.info('WEI: ', value);

      queue.create('transferTo', { to, value }).save();
    })
    .catch(logger.error.bind(logger))
});

queue.process('transferTo', 20, (job, done) => {
  const { to, value } = job.data;
  contract.transferTo(to, value)
    .then(tx => {
      logger.info("TRANSFER: ", tx.transactionHash);
      done(null, tx);
    })
    .catch(error => {
      logger.error(error);
      done(error, null)
    });
});

queue.process('price', 30, (job, done) => {
  Price.update()
    .then(price => done(null, price))
    .catch(error => done(error, null))
});

priceUpdateSchedule();

queue.on('error', shutdown);
process.once('SIGTERM', shutdown);
