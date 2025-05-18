const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { createNamespace } = require('cls-hooked');

// Create a namespace for the correlation ID
const namespace = createNamespace('aws-gpu-spot-monitor');

// Initialize CloudWatch Logs client
const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'cyan'
};

// Add colors to winston
winston.addColors(colors);

// Custom format for structured logging
const structuredFormat = winston.format((info) => {
  // Add correlation ID if available
  const correlationId = namespace.get('correlationId') || 'unknown';
  
  // Add request ID if available
  const requestId = namespace.get('requestId') || 'unknown';
  
  // Add user ID if available
  const userId = namespace.get('userId') || 'system';
  
  // Add instance ID if available
  const instanceId = namespace.get('instanceId') || 'unknown';
  
  // Add environment
  const environment = process.env.NODE_ENV || 'development';
  
  // Add service name
  const service = process.env.SERVICE_NAME || 'aws-gpu-spot-monitor';
  
  // Add hostname
  const hostname = require('os').hostname();
  
  // Add structured context
  info.context = {
    correlationId,
    requestId,
    userId,
    instanceId,
    environment,
    service,
    hostname
  };
  
  // If metadata is provided, add it to the context
  if (info.metadata) {
    info.context = { ...info.context, ...info.metadata };
    delete info.metadata;
  }
  
  return info;
})();

// Define the format for console logs
const consoleFormat = winston.format.combine(
  structuredFormat,
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const context = Object.entries(info.context || {})
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      
      return `${info.timestamp} ${info.level}: ${info.message} ${context}`;
    }
  )
);

// Define the format for file and CloudWatch logs (JSON)
const jsonFormat = winston.format.combine(
  structuredFormat,
  winston.format.timestamp(),
  winston.format.json()
);

// Define which transports to use
const transports = [
  new winston.transports.Console({
    format: consoleFormat
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    format: jsonFormat
  })
];

// Add CloudWatch transport if enabled
if (process.env.ENABLE_CLOUDWATCH_LOGS === 'true') {
  const { CloudWatchLogsTransport } = require('winston-cloudwatch');
  
  transports.push(new CloudWatchLogsTransport({
    logGroupName: `/aws-gpu-spot-monitor/${process.env.NODE_ENV || 'development'}`,
    logStreamName: `${require('os').hostname()}-${new Date().toISOString().slice(0, 10)}`,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    messageFormatter: ({ level, message, context }) => {
      return JSON.stringify({
        level,
        message,
        ...context
      });
    }
  }));
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false
});

// Create a custom CloudWatch metrics logger
const logMetric = async (metricName, value, unit = 'Count', dimensions = {}) => {
  try {
    // Add standard dimensions
    const standardDimensions = {
      Environment: process.env.NODE_ENV || 'development',
      Service: process.env.SERVICE_NAME || 'aws-gpu-spot-monitor'
    };
    
    // Combine with custom dimensions
    const allDimensions = { ...standardDimensions, ...dimensions };
    
    // Convert to CloudWatch format
    const cloudWatchDimensions = Object.entries(allDimensions).map(([Name, Value]) => ({
      Name,
      Value
    }));
    
    // Create CloudWatch client
    const cloudWatch = new AWS.CloudWatch({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    // Publish metric
    await cloudWatch.putMetricData({
      Namespace: process.env.CLOUDWATCH_NAMESPACE || 'aws-gpu-spot-monitor',
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: cloudWatchDimensions,
          Value: value,
          Unit: unit,
          Timestamp: new Date()
        }
      ]
    }).promise();
    
    logger.debug('Published CloudWatch metric', {
      metadata: {
        metricName,
        value,
        unit,
        dimensions: allDimensions
      }
    });
  } catch (error) {
    logger.error('Failed to publish CloudWatch metric', {
      metadata: {
        metricName,
        value,
        unit,
        dimensions,
        error: error.message
      }
    });
  }
};

// Helper to create a correlation ID and store it in the namespace
const withCorrelationId = (fn, correlationId = uuidv4()) => {
  return namespace.runAndReturn(() => {
    namespace.set('correlationId', correlationId);
    return fn();
  });
};

// Helper to set request context
const setRequestContext = (requestId, userId, instanceId) => {
  if (namespace.active) {
    if (requestId) namespace.set('requestId', requestId);
    if (userId) namespace.set('userId', userId);
    if (instanceId) namespace.set('instanceId', instanceId);
  }
};

// Helper to get the current correlation ID
const getCorrelationId = () => {
  return namespace.active ? namespace.get('correlationId') : null;
};

// Enhance the logger with additional methods
const enhancedLogger = {
  error: (message, metadata) => logger.error(message, { metadata }),
  warn: (message, metadata) => logger.warn(message, { metadata }),
  info: (message, metadata) => logger.info(message, { metadata }),
  http: (message, metadata) => logger.http(message, { metadata }),
  debug: (message, metadata) => logger.debug(message, { metadata }),
  trace: (message, metadata) => logger.trace(message, { metadata }),
  
  // Add metric logging
  metric: logMetric,
  
  // Add correlation ID helpers
  withCorrelationId,
  getCorrelationId,
  setRequestContext
};

module.exports = enhancedLogger;