const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token from Cognito
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // In a real application, we would verify the token with Cognito
    // For now, we'll just decode it and check if it's valid
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedError('Invalid token');
    }
    
    // Add user ID to request headers
    req.headers['x-user-id'] = decoded.sub;
    
    // Add user email to request headers if available
    if (decoded.email) {
      req.headers['x-user-email'] = decoded.email;
    }
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    next(error);
  }
};

module.exports = {
  verifyToken
};