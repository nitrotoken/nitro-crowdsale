'use strict';

const contract = require('../rpc/contract');
const ethereum = require('../rpc/ethereum');
const bitcoin = require('../rpc/bitcoin');
const etherscan = require('../rpc/etherscan');
const TxObject = require('../models/TxObject');

const {
  RpcError,
  UserNotFound,
  InternalError
} = require('../models/Error');

/**
 * @swagger
 * /txs/{type}/{address}:
 *   get:
 *     x-swagger-router-controller:
 *       wallet
 *     operationId:
 *       tx
 *     tags:
 *       - Wallet
 *     description: Возвращает историю транзакций
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: type
 *         description: Тип кошелька
 *         in: path
 *         required: true
 *         type: string
 *         enum: [eth, btc]
 *       - name: address
 *         description: Адрес кошелька
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       default:
 *         description: Информация о транзакции, которая деверифицирует пользователя
 *         schema:
 *          type: array
 *          items:
 *            $ref: '#/definitions/TxObject'
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function tx(req, res){
  const type = req.swagger.params.type.value;
  const address = req.swagger.params.address.value;

  let promise = Promise.reject(new InternalError());
  switch(type){
    case 'eth':
      promise = etherscan.account.txlist(address, 1, 'latest', 'asc')
        .then(
          txlist => txlist.result.map(TxObject.fromEth.bind(TxObject)),
          () => []
        )
      break;
    case 'btc':
      promise = bitcoin.txByAddr(address)
        .then(
          txlist => txlist.txs.map(tx => TxObject.fromBtc(tx, address)),
          () => []
        )
      break;
  }

  promise
    .then(
      txs =>
        res
          .status(200)
          .json(txs)
    )
    .catch(
      e => console.log(e) ||
        res
          .status(500)
          .json(new InternalError())
    )
}



module.exports = { tx };