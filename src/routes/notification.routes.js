const express = require('express');
const notificationService = require('../services/notification.service');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Extract user ID from JWT token
 * @param {object} req - Express request object
 * @returns {string} User ID
 */
const extractUserId = (req) => {
  // In a real application, this would be extracted from the JWT token
  // For now, we'll get it from the request headers set by the Cognito authorizer
  const userId = req.headers['x-user-id'] || req.headers['cognito:username'];
  
  if (!userId) {
    throw new BadRequestError('User ID not found in request');
  }
  
  return userId;
};

/**
 * @route GET /api/notifications/preferences
 * @desc Get notification preferences for the current user
 * @access Private
 */
router.get('/preferences', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    const preferences = await notificationService.getUserPreferences(userId);
    
    res.status(200).json({
      status: 'success',
      data: preferences
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/notifications/preferences
 * @desc Create or update notification preferences
 * @access Private
 */
router.post('/preferences', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const preferences = req.body;
    
    if (!preferences) {
      throw new BadRequestError('Preferences are required');
    }
    
    const savedPreferences = await notificationService.saveUserPreferences(userId, preferences);
    
    res.status(200).json({
      status: 'success',
      data: savedPreferences
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/notifications/preferences
 * @desc Delete notification preferences
 * @access Private
 */
router.delete('/preferences', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    const result = await notificationService.deleteUserPreferences(userId);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/notifications/send
 * @desc Send a notification to the current user
 * @access Private
 */
router.post('/send', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const { subject, message, severity, metadata } = req.body;
    
    if (!subject || !message) {
      throw new BadRequestError('Subject and message are required');
    }
    
    const result = await notificationService.sendUserNotification(
      userId,
      subject,
      message,
      severity || notificationService.NotificationSeverity.INFO,
      metadata || {}
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/notifications/logs
 * @desc Get notification logs for the current user
 * @access Private
 * @query {number} limit - Maximum number of logs to return (default: 50)
 * @query {string} startDate - Start date for filtering (ISO string)
 * @query {string} endDate - End date for filtering (ISO string)
 */
router.get('/logs', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const { limit, startDate, endDate } = req.query;
    
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      throw new BadRequestError('Limit must be a number between 1 and 1000');
    }
    
    const logs = await notificationService.getUserNotificationLogs(
      userId,
      limitNum,
      startDate,
      endDate
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        count: logs.length,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/notifications/channels
 * @desc Get available notification channels
 * @access Private
 */
router.get('/channels', (req, res) => {
  const channels = Object.values(notificationService.NotificationChannel);
  
  res.status(200).json({
    status: 'success',
    data: {
      channels
    }
  });
});

/**
 * @route GET /api/notifications/severity-levels
 * @desc Get available notification severity levels
 * @access Private
 */
router.get('/severity-levels', (req, res) => {
  const severityLevels = Object.values(notificationService.NotificationSeverity);
  
  res.status(200).json({
    status: 'success',
    data: {
      severityLevels
    }
  });
});

module.exports = router;