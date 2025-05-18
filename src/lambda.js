const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const logger = require('./utils/logger');

// Create the server
const server = awsServerlessExpress.createServer(app);

// Export the handler function
exports.handler = (event, context) => {
  logger.info('Lambda invocation', { event });
  return awsServerlessExpress.proxy(server, event, context);
};