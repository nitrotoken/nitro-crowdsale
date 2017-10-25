#!/usr/bin/env node
'use strict';

const app = require('../src/app.js');
const mongoose = require('mongoose');


mongoose.connection.on('connected', function () {  
  app.listen(8080, () =>
    console.log("App started on port 8080")
  );
}); 

mongoose.connection.on('error',function (err) {  
  console.log('Mongoose: ' + err);
  process.exit(0);
}); 

mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose disconnected');
  process.exit(0); 
});

process.on('SIGINT', function() {  
  mongoose.connection.close(function(){ 
    process.exit(0); 
  }); 
}); 