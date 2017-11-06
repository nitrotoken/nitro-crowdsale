'use strict';

const mongoose = require('mongoose');
const promisify = require('../lib/utils').promisify;
const cc = require('../lib/Cryptocompare');

/**
 * @swagger
 * definitions:
 *   User:
 *     type: object
 *     required:
 *       - token
 *     properties:
 *       token:
 *         type: string
 *         description: Токен пользователя
 */
const PriceSchema = new mongoose.Schema({
  btc: {
    type: Number,
    required: true
  },
  usd: {
    type: Number,
    required: true
  },
  eur: {
    type: Number,
    required: true
  }
});


/**
 * Methods
 */
PriceSchema.method({

  toJSON(){
    const { token } = this;
    return { token };
  }

});
  
/**
 * Statics
 */
PriceSchema.static({

  last(){
    const findOne = promisify(this.findOne.bind(this));
    const create  = promisify(this.create.bind(this));
    return findOne({})
      .then(
        price =>
          (!!price)
            ? price
            : cc.price()     
              .then(create)
      )
  },

  update(){
    const findOne = promisify(this.findOne.bind(this));
    const create  = promisify(this.create.bind(this));
 
    return Promise.all([
      findOne({}),
      cc.price()
    ]).then(([price, data]) => {
      if(!!!price){
        return create(data);
      }

      price.btc = data.btc;
      price.usd = data.usd;
      price.eur = data.eur;
      
      return price.save()
    })
  }

});
  
/**
 * Register
 */
module.exports = mongoose.model('Price', PriceSchema);