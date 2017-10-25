const rpc = require('./rpc/bitcoin');

const addr = require('./config').btcCompanyAddr;

const socket = require('socket.io-client')(rpc.host);
const kue = require('kue');

const queue = kue.createQueue();

socket.on('connection', console.log.bind(console, 'connected'));
socket.on('connect', socket.emit.bind(socket,'subscribe', 'inv'));

socket.on('tx', tx => {
  const vout = tx.vout.find(out => !!out[addr])
  if(!!!vout){
    return;
  }
  queue
    .create('tx', { id: tx.txid, value: parseInt(vout[addr]) })
    .save();
});