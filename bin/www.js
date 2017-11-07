#!/usr/bin/env node
'use strict';

const app = require('../src/app.js');
const mongoose = require('../src/config/mongoose');
const logger = require('../src/config/logger')('app');

mongoose.connection.on('connected', function () {  
  app.listen(8080, () =>
    logger.info("Started on port 8080")
  );
}); 

process.on('SIGINT', function() {  
  mongoose.connection.close(function(){ 
    process.exit(0); 
  }); 
}); 