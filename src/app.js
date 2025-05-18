const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const { verifyToken } = require('./middleware/auth.middleware');
const loggingMiddleware = require('./middleware/logging.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const spotPriceRoutes = require('./routes/spotPrice.routes');
const instanceRoutes = require('./routes/instance.routes');
const foldingRoutes = require('./routes/folding.routes');
const notificationRoutes = require('./routes/notification.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced request logging middleware with correlation IDs
app.use(loggingMiddleware);

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes with authentication middleware
app.use('/api/spot-prices', verifyToken, spotPriceRoutes);
app.use('/api/instances', verifyToken, instanceRoutes);
app.use('/api/folding', verifyToken, foldingRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error with enhanced metadata
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    requestId: req.headers['x-request-id'] || req.headers['x-amzn-requestid'],
    correlationId: res.getHeader('X-Correlation-ID'),
    userId: req.user ? req.user.id : 'anonymous'
  });
  
  // Log error metric
  logger.metric('ApiError', 1, 'Count', {
    ErrorType: err.name || 'Error',
    StatusCode: (err.statusCode || 500).toString(),
    Path: req.path,
    Method: req.method
  });
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    correlationId: res.getHeader('X-Correlation-ID')
  });
});

// 404 handler
app.use((req, res) => {
  // Log not found with enhanced metadata
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    correlationId: res.getHeader('X-Correlation-ID')
  });
  
  // Log 404 metric
  logger.metric('RouteNotFound', 1, 'Count', {
    Path: req.path,
    Method: req.method
  });
  
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Route not found',
    correlationId: res.getHeader('X-Correlation-ID')
  });
});

module.exports = app;