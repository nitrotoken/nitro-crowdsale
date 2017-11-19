'use strict';
const BigNumber = require('bignumber.js');
const ethereum = require('../rpc/ethereum');
const ethCrowsale = require('../config').ethCrowsale;
const crowdsale = require('../rpc/crowdsale');

const preSaleStart = 1511020800;
const preSaleEnd = 1511452800;
const saleStart = 1512057600;
const saleStartFirstDayEnd = 1512144000;
const saleStartSecondDayEnd = 1512316800;
const saleEnd = 1514304000;

const preSaleRate = 1040;
const saleRate = 800;
const saleRateFirstDay = 1000;
const saleRateSecondDay = 920;

function Rate(date = (Date.now()/1000 | 0)){
  if(date>=preSaleStart && date<=preSaleEnd){
    return preSaleRate;
  }else if(date>=saleStart && date<=saleStartFirstDayEnd){
    return saleRateFirstDay;
  }else if(date>=saleRateFirstDay && date<=saleStartSecondDayEnd){
    return saleRateSecondDay;
  }
  return saleRate;
}

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

function btcTx2status(tx){}

function rate(){
  if (isPresale()) {
    return preSaleRate;
  } else if (now>=saleStart && now<=(saleStartFirstDayEnd)){
    return saleRateFirstDay;
  } else if (now>(saleStartFirstDayEnd) && now<=(saleStartSecondDayEnd)){
    return saleRateSecondDay;
  }
  return saleRate;
}

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
    const isNox = (tx.contractAddress===ethCrowsale || tx.to===ethCrowsale);
    const rate = Rate(+tx.timeStamp);
    let nox = 0;
    if(isNox){
      nox = ethereum.utils.fromWei(new BigNumber(tx.value).mul(rate).toString());
    }
    return new TxObject(
      tx.hash,
      parseInt(tx.timeStamp),
      isNox ? 'BUY NOX' : 'OTHER',
      ethTx2status(tx),
      ethereum.utils.fromWei(tx.value),
      nox,
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