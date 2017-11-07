const kue = require('kue');
const rpc = require('./rpc/bitcoin');
const logger = require('./config/logger')('btc-listener');
const queue = require('./config/queue')();
const btcAddress = require('./config').btcAddress;

const socket = require('socket.io-client')(rpc.host);

function shutdown(error){
  logger.info('turn off');
  !!error && logger.error(error);
  socket.close();
  queue.shutdown(5000, err => {
    !!err && logger.error(err);
    logger.info('Kue shutdown');
    process.exit(0);
  });
}

socket.on('connect', () => {
  logger.info(`connected to: ${rpc.host}`);
  socket.emit('subscribe', 'inv');
});

socket.on('tx', tx => {
  const vout = tx.vout.find(out => !!out[btcAddress])
  if(!!!vout){
    return;
  }

  const txid = tx.txid;
  const value = vout[btcAddress];

  logger.info('tx:', tx.txid);
  logger.info('value:', value);

  queue
    .create('tx', { id: tx.txid, value })
    .save();
});

queue.on('error', shutdown);
process.once('SIGTERM', shutdown);