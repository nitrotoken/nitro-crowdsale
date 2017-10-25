'use strict';

const Fetch = require('node-fetch');

/**
 * Promisify callback function
 * @param {Function} action
 * @return {Function}
 */
const promisify =
(action) =>
  (...args) =>
    new Promise((resolve, reject) => action.call(null, ...args, (error, ...other) => {
      if (error) {
        reject(error);
      } else {
        resolve(...other);
      }
    }));

/**
* Returns a curried equivalent of the provided function
* @params {Function} func
* @params {...any} params
* @return {Function}
*/
const curry =
(func, ...params) =>
  (...args) =>
    func.apply(null, [...params, ...args]);

/**
* Return composed result
* @param {...Function} functions
*/
const compose =
(...functions) =>
  (...args) =>
    functions
      .slice(1)
      .reduce(
        (x, f) => f(x),
        functions[0](...args)
      );

/**
* Return composed result for "promisified" functions
* @param {...Function} functions
*/
const pcompose =
(...functions) =>
  (...args) =>
    functions
      .slice(1)
      .reduce(
        async (x, f) => f(await x),
        functions[0](...args)
      );

/**
 * Fetch url and get json
 * @param {...Object} args 
 */
const fetch =
  (...args) =>
    Fetch(...args)
      .then(
        res =>
          res.json()
      );
    
module.exports = {
  promisify,
  curry,
  compose,
  pcompose,
  fetch
};