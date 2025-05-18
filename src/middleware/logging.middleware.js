const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware to add correlation ID and request context to each request
 * This enables request tracing across the application
 */
const loggingMiddleware = (req, res, next) => {
  // Generate a correlation ID if not already present
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Set the correlation ID in the response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Extract request ID if available (e.g., from AWS API Gateway)
  const requestId = req.headers['x-request-id'] || req.headers['x-amzn-requestid'] || uuidv4();
  
  // Extract user ID if available
  const userId = req.user ? req.user.id : 'anonymous';
  
  // Extract instance ID if available
  const instanceId = req.headers['x-instance-id'] || 'unknown';
  
  // Set request context in the logger
  logger.setRequestContext(requestId, userId, instanceId);
  
  // Run the request handler with the correlation ID
  logger.withCorrelationId(() => {
    // Log the request
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId,
      requestId,
      userId
    });
    
    // Capture the original end method
    const originalEnd = res.end;
    
    // Override the end method to log the response
    res.end = function(chunk, encoding) {
      // Call the original end method
      originalEnd.call(this, chunk, encoding);
      
      // Log the response
      logger.info('API Response', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: Date.now() - req._startTime,
        correlationId,
        requestId,
        userId
      });
      
      // Log metrics for API response time and status code
      logger.metric('ApiResponseTime', Date.now() - req._startTime, 'Milliseconds', {
        Method: req.method,
        Path: req.path,
        StatusCode: res.statusCode.toString()
      });
      
      // Log metrics for API status codes
      logger.metric('ApiStatusCode', 1, 'Count', {
        Method: req.method,
        Path: req.path,
        StatusCode: res.statusCode.toString()
      });
    };
    
    // Record the start time
    req._startTime = Date.now();
    
    // Continue to the next middleware
    next();
  }, correlationId);
};

module.exports = loggingMiddleware;