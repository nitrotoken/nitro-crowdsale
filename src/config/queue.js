const kue = require('kue');
const redis = require('./index').redis;

module.exports = function(){
  return kue.createQueue({ redis });
}