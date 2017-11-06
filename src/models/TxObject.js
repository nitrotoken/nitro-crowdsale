'use strict';
const BigNumber = require('bignumber.js');
const ethereum = require('../rpc/ethereum');

const STATUS = {
  confirmed: 0,
  notConfirmed: 1,
  error: 2
};

function ethTx2status(tx){
  if(tx.isError!=='0'){
    return STATUS.error
  }
  return (tx.confirmations==='0')
    ? STATUS.notConfirmed
    : STATUS.confirmed;
}

function ethDataDecode(data = ''){
  //ToDo: Fucking todo for decode description
  return 'BUY NOX';
}

function btcTx2status(tx){}

/**
 * @swagger
 * definitions:
 *   TxObject:
 *     type: object
 *     properties:
 *       txid:
 *         type: string
 *         description: Хэш транзакции
 *       date:
 *         type: number
 *         description: Timestamp, время
 *       status:
 *         type: number
 *         enum: [0,1,2]
 *         description: 0 - подтверждена, 1 - не подтверждена, 2 - ошибка
 *       amount:
 *         type: number
 *         description: Сумма транзакции (ETH|BTC)
 *       nox:
 *         type: number
 *         description: Сколько NOX получил
 *       type:
 *         type: string
 *         description: Сеть (btc|eth)
 *         enum: [btc, eth]
 *       from:
 *         type: string
 *         description: Отправитель
 *       to:
 *         type: string
 *         description: Получатель
 */
module.exports = class TxObject{

  constructor(id, date, desc, status, amount, nox, type, from, to){
    this.txid = id;
    this.date = date;
    this.desc = desc;
    this.status = status;
    this.amount = amount;
    this.nox = nox;
    this.type = type;
    this.from = from;
    this.to = to;
  }

  static get statuses(){
    return STATUS
  }

  static fromEth(tx){
    return new TxObject(
      tx.hash,
      parseInt(tx.timeStamp),
      ethDataDecode(tx.input),
      ethTx2status(tx),
      new BigNumber(tx.value).div(ethereum.utils.unitMap.ether).toNumber(),
      0,
      'eth',
      tx.from,
      (tx.to==='')?tx.contractAddress:tx.to
    )
  }

  static fromBtc(tx, address){
    let vout = tx.vout.find(vout => !!~vout.scriptPubKey.addresses.indexOf(address))
    return new TxObject(
      tx.txid,
      parseInt(tx.time),
      null,
      (tx.confirmations>0) ? STATUS.confirmed : STATUS.notConfirmed,
      parseFloat(vout.value),
      0,
      'btc',
      tx.vin[0].addr,
      tx.vout[0].scriptPubKey.addresses[0]
    )
  }

  toJSON(){
    const { txid, date, desc, status, amount, nox, type, from, to } = this;
    return { txid, date, desc, status, amount, nox, type, from, to };
  }

  toString(){
    return JSON.stringify(this.toJSON());
  }
}