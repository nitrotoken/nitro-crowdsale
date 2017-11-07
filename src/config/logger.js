const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: {
      type: 'stdout'
    }
  },
  categories: {
    default: {
      appenders: ['out'], 
      level: 'debug' 
    } 
  }
});

module.exports = function logger(namespace = 'default'){
  return log4js.getLogger(namespace);
}