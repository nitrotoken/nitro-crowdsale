'use strict';
const BigNumber = require('bignumber.js');

const contract = require('../rpc/contract');
const ethereum = require('../rpc/ethereum');
const bitcoin = require('../rpc/bitcoin');
const poloniex = require('../rpc/poloniex');

const promisify = require('../lib/utils').promisify;
const compose = require('../lib/utils').compose;

const {
  InternalError
} = require('../models/Error');

/**
 * @swagger
 * /verify/{address}:
 *   get:
 *     x-swagger-router-controller:
 *       token
 *     operationId:
 *       verify
 *     tags:
 *       - Token
 *     description: Верифицирует ETH-кошелек пользователя
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: address
 *         description: Адрес ETH-кошелька
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       default:
 *         description: Информация о транзакции, которая верифицирует пользователя
 *         schema:
 *          type: object
 *          properties:
 *            address:
 *              type: string
 *            tx:
 *              type: object
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function verify(req, res){
  const address = req.swagger.params.address.value;
  
  contract
    .verify(address)
    .then(
      tx =>
        res
          .status(200)
          .json({ address, tx })
    )
    .catch(
      () =>
        res
          .status(500)
          .json(new InternalError())
    )
}

/**
 * @swagger
 * /unverify/{address}:
 *   get:
 *     x-swagger-router-controller:
 *       token
 *     operationId:
 *       unverify
 *     tags:
 *       - Token
 *     description: Убирает состояние верифицированности ETH-кошелека пользователя
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: address
 *         description: Адрес ETH-кошелька
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       default:
 *         description: Информация о транзакции, которая деверифицирует пользователя
 *         schema:
 *          type: object
 *          properties:
 *            address:
 *              type: string
 *            tx:
 *              type: object
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function unverify(req, res){
  const address = req.swagger.params.address.value;
  
  contract
    .verify(address)
    .then(
      tx =>
        res
          .status(200)
          .json({ address, tx })
    )
    .catch(
      () =>
        res
          .status(500)
          .json(new InternalError())
    )
}

/**
 * @swagger
 * /verified/{address}:
 *   get:
 *     x-swagger-router-controller:
 *       token
 *     operationId:
 *       verified
 *     tags:
 *       - Token
 *     description: Возвращает состояние верифицированности пользователя
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: address
 *         description: Адрес ETH-кошелька
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       default:
 *         description: Состояние верифицированности запрашиваемого кошелька
 *         schema:
 *          type: object
 *          properties:
 *            address:
 *              type: string
 *            verified:
 *              type: boolean
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function verified(req, res){
  const address = req.swagger.params.address.value;

  contract
    .verified(address)
    .then(
      verified =>
        res
          .status(200)
          .json({ address, verified })
    )
    .catch(
      () =>
        res
          .status(500)
          .json(new InternalError())
    )
  
}

/**
 * @swagger
 * /balance/{address}:
 *   get:
 *     x-swagger-router-controller:
 *       token
 *     operationId:
 *       balance
 *     tags:
 *       - Token
 *     description: Возвращает балансы токенов
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: address
 *         description: Адрес ETH-кошелька
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       default:
 *         description: Возвращает балансы
 *         schema:
 *          type: object
 *          properties:
 *            balance:
 *              type: integer
 *              description: Текущий баланс
 *            frozen:
 *              type: integer
 *              description: Замороженный баланс
 *       200:
 *         description: Возвращает балансы
 *         schema:
 *          type: object
 *          properties:
 *            balance:
 *              type: integer
 *              description: Текущий баланс
 *            frozen:
 *              type: integer
 *              description: Замороженный баланс
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function balance(req, res){
  const address = req.swagger.params.address.value;
  const promise = (ethereum.utils.isAddress(address))
    ? Promise.resolve(address)
    : Promise.reject(new Error('not valid address'));
  promise
  .then(
    address =>
      Promise.all([
        contract.decimals(),
        contract.balanceOf(address),
        contract.frozenBalanceOf(address)
      ])
  )
  .then(
    ([decimals, balance, frozen]) =>
      ({
        decimals: parseInt(decimals),
        balance: (new BigNumber(balance)),
        frozen: (new BigNumber(frozen))
      })
  )
  .then(
    ({decimals, balance, frozen}) =>
      ({
        balance: balance.dividedBy(10**decimals).toNumber(),
        frozen: frozen.dividedBy(10**decimals).toNumber()
      })
  )
  .then(
    data =>
      res
        .status(200)
        .json(data)
  ).catch(
    (e) => console.log(e) ||
      res
        .status(500)
        .json(new InternalError())
  )
}


/**
 * @swagger
 * /stats:
 *   get:
 *     x-swagger-router-controller:
 *       token
 *     operationId:
 *       stats
 *     tags:
 *       - Token
 *     description: Возвращает стоимость токенов в BTC и ETH
 *     produces:
 *       - application/json
 *     responses:
 *       default:
 *         description: Информация о транзакции, которая верифицирует пользователя
 *         schema:
 *          type: object
 *          properties:
 *            nox2eth:
 *              type: number
 *            nox2btc:
 *              type: number
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function stats(req, res){
  const ether = ethereum.utils.unitMap.ether;
  const get24hVolume = promisify(poloniex.get24hVolume.bind(poloniex));
  const btc2eth =
    () =>
      get24hVolume()
        .then( ({ BTC_ETH, USDT_ETH }) => ({
          btc2eth: BTC_ETH['ETH']/BTC_ETH['BTC'],
          usdt2eth: USDT_ETH['USDT']/USDT_ETH['ETH']
        }));
  Promise.all([
    btc2eth(),
    contract.price()
  ]).then(
    ([coef, price]) =>
      [ coef, new BigNumber(price) ]
  ).then(
    ([ { btc2eth, usdt2eth }, price]) => {
      const nox2eth = price.div(ether).toNumber();
      const nox2btc = price.div(ether).div(btc2eth.toString()).toNumber();
      const nox2usd = nox2eth * usdt2eth; 
      //ToDo: implement invested
      return {
        nox2eth,
        nox2btc,
        nox2usd,
        invested: {
          btc: 5,
          eth: 10,
          usd: 33000,
          total: 100000,
          investorsCount: 6
        }
      }
    }
  )
  .then(
    data =>
      res
        .status(200)
        .json(data)
  )
  .catch(
    e =>
      res
        .status(500)
        .json(new InternalError())
  )
}

module.exports = { balance, verified, verify, unverify, stats };