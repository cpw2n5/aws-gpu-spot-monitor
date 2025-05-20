import { createServer, proxy } from 'aws-serverless-express';
import app from './app';
import { info } from './utils/logger';

// Create the server
const server = createServer(app);

// Export the handler function
export function handler(event, context) {
  info('Lambda invocation', { event });
  return proxy(server, event, context);
}