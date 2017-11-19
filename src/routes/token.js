'use strict';
const BigNumber = require('bignumber.js');

const btcAddress = require('../config').btcAddress;
const tokenStat = require('../config').tokenStat;
const crowdsale = require('../rpc/crowdsale');
const token = require('../rpc/token');

const Price = require('../models/Price');
const holedrsCount = require('../lib/tools').holedrsCount;

const ethereum = require('../rpc/ethereum');
const bitcoin = require('../rpc/bitcoin');

const promisify = require('../lib/utils').promisify;
const compose = require('../lib/utils').compose;
const isAddress = require('../lib/utils').isAddress;

const { btc2big, wei2big, tokensSold } = require('../lib/tools');

const {
  InternalError
} = require('../models/Error');

let HOLDERS = 0;

function holdersUpdate(){
  holedrsCount()
    .then(c => HOLDERS = c)
    .catch(e => {});
}
holdersUpdate();
setInterval(holdersUpdate, 5*60*1000);

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
  
  isAddress(address)
  .then(
    address =>
      crowdsale
        .verify(address)
  )
  .then(
    tx =>
      res
        .status(200)
        .json({ address, tx })
  )
  .catch(
    e =>
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

  isAddress(address)
  .then(
    address =>
      crowdsale
        .isVerified(address)
  )
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
  const fromWei = ethereum.utils.fromWei;

  isAddress(address)
  .then(
    address =>
      Promise.all([
        token.balanceOf(address),
        crowdsale.owedTokens(address)
      ])
  )
  .then(
    ([balance, frozen]) =>
      ({
        balance: fromWei(balance),
        frozen: fromWei(frozen)
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
  Promise.all([
    Price.last(),
    crowdsale.rate(),
    crowdsale.weiRaised(),
    bitcoin.balance(btcAddress),
    tokensSold()
  ])
  .then(([exch, rate, weiRaised, satRaised, nox]) => {
    const nox2eth = new BigNumber((1/(+rate)).toString());
    const nox2btc = nox2eth.mul(exch.btc);
    const nox2usd = nox2eth.mul(exch.usd);
    
    const btc = btc2big(satRaised);
    const eth = wei2big(weiRaised);
    const usd = btc.div(exch.btc).mul(exch.usd).add(eth.mul(exch.usd));  

    return {
      exch,
      nox,
      avg: nox.div(tokenStat.hardCapPresale),
      nox2eth,
      nox2btc,
      nox2usd,
      invested: {
        btc,
        eth,
        usd,
        total: usd,
        investorsCount: HOLDERS
      }
    }
  })
  .then(
    data =>
      res
        .status(200)
        .json(data)
  )
  .catch(
    e => console.log(e) ||
      res
        .status(500)
        .json(new InternalError())
  )
}

module.exports = { balance, verified, verify, stats };