'use strict';

const contract = require('../rpc/contract');
const ethereum = require('../rpc/ethereum');
const bitcoin = require('../rpc/bitcoin');

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
 *            decimals:
 *              type: integer
 *              description: Делитель
 *       500:
 *         description: При появлении внутренней ошибки
 *         schema:
 *           $ref: '#/definitions/InternalError'
 */
function balance(req, res){
  const address = req.swagger.params.address.value;

  Promise.all([
    contract.decimals(),
    contract.balanceOf(address),
    contract.frozenBalanceOf(address)
  ]).then(
    (decimals, balance, frozen) =>
      res
        .status(200)
        .json({ balance, frozen, decimals})
  ).catch(
    (e) => console.log(e) ||
      res
        .status(500)
        .json(new InternalError())
  )
}

module.exports = { balance, verified, verify, unverify };