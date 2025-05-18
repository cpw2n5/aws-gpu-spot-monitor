const AWS = require('aws-sdk');
const axios = require('axios');
const logger = require('../utils/logger');
const dynamodb = require('../utils/dynamodb');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// Initialize AWS SDK clients
const sns = new AWS.SNS({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Notification channels
 * @enum {string}
 */
const NotificationChannel = {
  EMAIL: 'email',
  SMS: 'sms',
  SLACK: 'slack'
};

/**
 * Notification severity levels
 * @enum {string}
 */
const NotificationSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Save user notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Notification preferences
 * @returns {Promise<object>} Saved preferences
 */
const saveUserPreferences = async (userId, preferences) => {
  try {
    if (!preferences) {
      throw new BadRequestError('Preferences are required');
    }

    // Validate preferences
    if (preferences.channels) {
      for (const channel of preferences.channels) {
        if (!Object.values(NotificationChannel).includes(channel.type)) {
          throw new BadRequestError(`Invalid notification channel: ${channel.type}`);
        }

        // Validate channel-specific settings
        switch (channel.type) {
          case NotificationChannel.EMAIL:
            if (!channel.email) {
              throw new BadRequestError('Email address is required for email notifications');
            }
            break;
          case NotificationChannel.SMS:
            if (!channel.phoneNumber) {
              throw new BadRequestError('Phone number is required for SMS notifications');
            }
            break;
          case NotificationChannel.SLACK:
            if (!channel.webhookUrl) {
              throw new BadRequestError('Webhook URL is required for Slack notifications');
            }
            break;
        }
      }
    }

    // Check if user already has preferences
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const existingPrefs = await dynamodb.queryItems('notification-preferences', params);

    let prefId;
    let createdAt;

    if (existingPrefs.length > 0) {
      // Update existing preferences
      prefId = existingPrefs[0].id;
      createdAt = existingPrefs[0].createdAt;
    } else {
      // Create new preferences
      prefId = uuidv4();
      createdAt = new Date().toISOString();
    }

    // Prepare preferences object
    const notificationPreferences = {
      id: prefId,
      userId,
      channels: preferences.channels || [],
      severityLevels: preferences.severityLevels || Object.values(NotificationSeverity),
      createdAt,
      updatedAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await dynamodb.putItem('notification-preferences', notificationPreferences);

    logger.info('Saved notification preferences', { userId, prefId });

    return notificationPreferences;
  } catch (error) {
    logger.error('Error saving notification preferences', { error, userId });
    throw error;
  }
};

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} User's notification preferences
 */
const getUserPreferences = async (userId) => {
  try {
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const prefs = await dynamodb.queryItems('notification-preferences', params);

    if (prefs.length === 0) {
      // Return default preferences if none exists
      return {
        channels: [],
        severityLevels: Object.values(NotificationSeverity)
      };
    }

    return prefs[0];
  } catch (error) {
    logger.error('Error getting notification preferences', { error, userId });
    throw error;
  }
};

/**
 * Delete user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result
 */
const deleteUserPreferences = async (userId) => {
  try {
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const prefs = await dynamodb.queryItems('notification-preferences', params);

    if (prefs.length === 0) {
      throw new NotFoundError('Notification preferences not found');
    }

    // Delete the preferences
    await dynamodb.deleteItem('notification-preferences', { id: prefs[0].id });

    logger.info('Deleted notification preferences', { userId });

    return {
      success: true,
      message: 'Notification preferences deleted successfully'
    };
  } catch (error) {
    logger.error('Error deleting notification preferences', { error, userId });
    throw error;
  }
};

/**
 * Send notification to a user
 * @param {string} userId - User ID
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Result
 */
const sendUserNotification = async (userId, subject, message, severity = NotificationSeverity.INFO, metadata = {}) => {
  try {
    // Get user preferences
    const preferences = await getUserPreferences(userId);

    // Check if user wants to receive notifications of this severity
    if (preferences.severityLevels && !preferences.severityLevels.includes(severity)) {
      logger.info('User does not want to receive notifications of this severity', { 
        userId, 
        severity,
        userSeverityLevels: preferences.severityLevels
      });
      return {
        success: false,
        message: `User does not want to receive ${severity} notifications`
      };
    }

    // If no channels configured, log a warning and return
    if (!preferences.channels || preferences.channels.length === 0) {
      logger.warn('No notification channels configured for user', { userId });
      return {
        success: false,
        message: 'No notification channels configured'
      };
    }

    // Send notification to each configured channel
    const results = [];
    for (const channel of preferences.channels) {
      try {
        let result;
        switch (channel.type) {
          case NotificationChannel.EMAIL:
            result = await sendEmailNotification(channel.email, subject, message, severity, metadata);
            break;
          case NotificationChannel.SMS:
            result = await sendSmsNotification(channel.phoneNumber, subject, message, severity, metadata);
            break;
          case NotificationChannel.SLACK:
            result = await sendSlackNotification(channel.webhookUrl, subject, message, severity, metadata);
            break;
          default:
            logger.warn('Unknown notification channel', { channel });
            continue;
        }
        results.push({ channel: channel.type, success: true, result });
      } catch (error) {
        logger.error(`Error sending ${channel.type} notification`, { error, userId, channel });
        results.push({ channel: channel.type, success: false, error: error.message });
      }
    }

    // Log notification
    await logNotification(userId, subject, message, severity, metadata, results);

    return {
      success: true,
      message: 'Notification sent',
      results
    };
  } catch (error) {
    logger.error('Error sending notification', { error, userId, subject });
    throw error;
  }
};

/**
 * Send email notification
 * @param {string} email - Email address
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Result
 */
const sendEmailNotification = async (email, subject, message, severity, metadata) => {
  try {
    // Format email body with severity and metadata
    const htmlBody = `
      <h2>${subject}</h2>
      <p><strong>Severity:</strong> ${severity}</p>
      <p>${message}</p>
      ${metadata && Object.keys(metadata).length > 0 ? `
        <h3>Additional Information:</h3>
        <ul>
          ${Object.entries(metadata).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
        </ul>
      ` : ''}
    `;

    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody
          },
          Text: {
            Charset: 'UTF-8',
            Data: `${subject}\n\nSeverity: ${severity}\n\n${message}\n\n${
              metadata && Object.keys(metadata).length > 0 ? 
                `Additional Information:\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}` : 
                ''
            }`
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `[${severity.toUpperCase()}] ${subject}`
        }
      },
      Source: process.env.NOTIFICATION_EMAIL_FROM || 'no-reply@aws-gpu-spot-monitor.com'
    };

    const result = await ses.sendEmail(params).promise();
    logger.info('Email notification sent', { email, subject, messageId: result.MessageId });
    return result;
  } catch (error) {
    logger.error('Error sending email notification', { error, email, subject });
    throw error;
  }
};

/**
 * Send SMS notification
 * @param {string} phoneNumber - Phone number
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Result
 */
const sendSmsNotification = async (phoneNumber, subject, message, severity, metadata) => {
  try {
    // Format SMS message (keep it short due to SMS limitations)
    const smsMessage = `[${severity.toUpperCase()}] ${subject}: ${message}`;

    const params = {
      Message: smsMessage,
      PhoneNumber: phoneNumber
    };

    const result = await sns.publish(params).promise();
    logger.info('SMS notification sent', { phoneNumber, subject, messageId: result.MessageId });
    return result;
  } catch (error) {
    logger.error('Error sending SMS notification', { error, phoneNumber, subject });
    throw error;
  }
};

/**
 * Send Slack notification
 * @param {string} webhookUrl - Slack webhook URL
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Result
 */
const sendSlackNotification = async (webhookUrl, subject, message, severity, metadata) => {
  try {
    // Set color based on severity
    let color;
    switch (severity) {
      case NotificationSeverity.INFO:
        color = '#2196F3'; // Blue
        break;
      case NotificationSeverity.WARNING:
        color = '#FF9800'; // Orange
        break;
      case NotificationSeverity.ERROR:
        color = '#F44336'; // Red
        break;
      case NotificationSeverity.CRITICAL:
        color = '#9C27B0'; // Purple
        break;
      default:
        color = '#2196F3'; // Default to blue
    }

    // Format Slack message
    const slackMessage = {
      attachments: [
        {
          color,
          pretext: `*[${severity.toUpperCase()}]* ${subject}`,
          text: message,
          fields: Object.entries(metadata).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          }))
        }
      ]
    };

    const result = await axios.post(webhookUrl, slackMessage);
    logger.info('Slack notification sent', { subject, statusCode: result.status });
    return { success: true, statusCode: result.status };
  } catch (error) {
    logger.error('Error sending Slack notification', { error, subject });
    throw error;
  }
};

/**
 * Log notification to DynamoDB
 * @param {string} userId - User ID
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @param {Array} results - Delivery results
 * @returns {Promise<object>} Saved notification log
 */
const logNotification = async (userId, subject, message, severity, metadata, results) => {
  try {
    const notificationLog = {
      id: uuidv4(),
      userId,
      subject,
      message,
      severity,
      metadata: JSON.stringify(metadata),
      deliveryResults: JSON.stringify(results),
      timestamp: new Date().toISOString()
    };

    await dynamodb.putItem('notification-logs', notificationLog);
    return notificationLog;
  } catch (error) {
    logger.error('Error logging notification', { error, userId, subject });
    // Don't throw here, as this is a secondary operation
    return null;
  }
};

/**
 * Get notification logs for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of logs to return
 * @param {string} startDate - Start date for filtering (ISO string)
 * @param {string} endDate - End date for filtering (ISO string)
 * @returns {Promise<Array>} Notification logs
 */
const getUserNotificationLogs = async (userId, limit = 50, startDate = null, endDate = null) => {
  try {
    let params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit,
      ScanIndexForward: false // Sort by timestamp descending
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      params.KeyConditionExpression += ' AND timestamp BETWEEN :startDate AND :endDate';
      params.ExpressionAttributeValues[':startDate'] = startDate;
      params.ExpressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      params.KeyConditionExpression += ' AND timestamp >= :startDate';
      params.ExpressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      params.KeyConditionExpression += ' AND timestamp <= :endDate';
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    const logs = await dynamodb.queryItems('notification-logs', params);

    // Parse JSON fields
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {},
      deliveryResults: log.deliveryResults ? JSON.parse(log.deliveryResults) : []
    }));
  } catch (error) {
    logger.error('Error getting notification logs', { error, userId });
    throw error;
  }
};

/**
 * Send a system notification to all users with matching preferences
 * @param {string} subject - Notification subject
 * @param {string} message - Notification message
 * @param {string} severity - Notification severity
 * @param {object} metadata - Additional metadata
 * @param {Array} tags - Tags for filtering users (optional)
 * @returns {Promise<object>} Result
 */
const sendSystemNotification = async (subject, message, severity = NotificationSeverity.INFO, metadata = {}, tags = []) => {
  try {
    // Get all users with notification preferences
    const allPrefs = await dynamodb.scanItems('notification-preferences');
    
    // Filter users by severity level and tags if provided
    const eligibleUsers = allPrefs.filter(pref => {
      // Check if user wants notifications of this severity
      const severityMatch = !pref.severityLevels || pref.severityLevels.includes(severity);
      
      // Check if user has matching tags (if tags are provided)
      const tagMatch = tags.length === 0 || (pref.tags && tags.some(tag => pref.tags.includes(tag)));
      
      return severityMatch && tagMatch;
    });
    
    logger.info('Sending system notification', { 
      subject, 
      severity, 
      totalUsers: allPrefs.length,
      eligibleUsers: eligibleUsers.length
    });
    
    // Send notification to each eligible user
    const results = [];
    for (const pref of eligibleUsers) {
      try {
        const result = await sendUserNotification(pref.userId, subject, message, severity, metadata);
        results.push({ userId: pref.userId, success: true, result });
      } catch (error) {
        logger.error('Error sending system notification to user', { error, userId: pref.userId });
        results.push({ userId: pref.userId, success: false, error: error.message });
      }
    }
    
    return {
      success: true,
      message: 'System notification sent',
      totalUsers: eligibleUsers.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    };
  } catch (error) {
    logger.error('Error sending system notification', { error, subject });
    throw error;
  }
};

module.exports = {
  NotificationChannel,
  NotificationSeverity,
  saveUserPreferences,
  getUserPreferences,
  deleteUserPreferences,
  sendUserNotification,
  getUserNotificationLogs,
  sendSystemNotification
};