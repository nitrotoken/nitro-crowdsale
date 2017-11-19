'use strict';

const Express = require('express');
const SwaggerJSDoc = require('swagger-jsdoc');
const SwaggerTools = require('swagger-tools').initializeMiddleware;

const models = require('./models');
const config = require('./config');
const mongoose = require('./config/mongoose');

const swaggerJsDoc = SwaggerJSDoc({
  swaggerDefinition: {
    info: {
      title: 'Crowdapi',
      version: '0.0.1',
      description: 'Funding service',
    },
    host: config.hostUri,
    basePath: '/',
  },
  apis: [
    'src/routes/**/*.js',
    'src/models/**/*.js', 
  ]
});

const app = Express();

SwaggerTools(swaggerJsDoc, middleware => {
  app.use(middleware.swaggerMetadata());
  app.use(middleware.swaggerValidator());
  app.use(middleware.swaggerRouter({
    controllers: 'src/routes',
  }));
  (config.env==='development') && app.use(middleware.swaggerUi());
});

app.use(function(err, req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.status(500);
  if(config.env==='development'){
    res.json(err);
  }else{
    res.end();
  }
});

module.exports = app;