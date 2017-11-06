const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger')('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUri, {
  useMongoClient: true
});

mongoose.connection.on('connected', function(){
  logger.info("Mongoose connected");
}); 

mongoose.connection.on('error',function(err){
  logger.error(err);
  process.exit(0);
}); 

mongoose.connection.on('disconnected', function () {  
  logger.error('Mongoose disconnected');
  process.exit(0); 
});

module.exports = mongoose;