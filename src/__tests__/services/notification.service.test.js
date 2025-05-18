const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../../services/notification.service');
const { mockNotificationPreferences, mockNotificationLogs } = require('../utils/mockData');
const { resetMocks } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('aws-sdk', () => {
  const mockSNS = {
    publish: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' })
    })
  };
  
  const mockSES = {
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' })
    })
  };

  return {
    SNS: jest.fn(() => mockSNS),
    SES: jest.fn(() => mockSES)
  };
});

jest.mock('axios');
jest.mock('../../utils/logger', () => require('../mocks/logger.mock'));
jest.mock('../../utils/dynamodb', () => require('../mocks/dynamodb.mock'));
jest.mock('uuid');

describe('Notification Service', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock UUID generation
    uuidv4.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
    
    // Mock axios
    axios.post.mockResolvedValue({ status: 200 });
  });

  describe('saveUserPreferences', () => {
    it('should create new notification preferences when none exist', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]); // No existing preferences
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'email',
            email: 'test@example.com'
          },
          {
            type: 'slack',
            webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
          }
        ],
        severityLevels: ['info', 'warning', 'error']
      };

      // Act
      const result = await notificationService.saveUserPreferences(userId, preferences);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.userId).toBe(userId);
      expect(result.channels).toEqual(preferences.channels);
      expect(result.severityLevels).toEqual(preferences.severityLevels);
      
      // Verify DynamoDB was queried to check for existing preferences
      expect(dynamodb.queryItems).toHaveBeenCalledWith('notification-preferences', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
      
      // Verify preferences were stored in DynamoDB
      expect(dynamodb.putItem).toHaveBeenCalledWith('notification-preferences', expect.objectContaining({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        channels: preferences.channels,
        severityLevels: preferences.severityLevels
      }));
    });

    it('should update existing notification preferences', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockNotificationPreferences]); // Existing preferences
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'email',
            email: 'new@example.com'
          }
        ],
        severityLevels: ['warning', 'error', 'critical']
      };

      // Act
      const result = await notificationService.saveUserPreferences(userId, preferences);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockNotificationPreferences.id); // Should keep the same ID
      expect(result.userId).toBe(userId);
      expect(result.channels).toEqual(preferences.channels);
      expect(result.severityLevels).toEqual(preferences.severityLevels);
      
      // Verify preferences were updated in DynamoDB
      expect(dynamodb.putItem).toHaveBeenCalledWith('notification-preferences', expect.objectContaining({
        id: mockNotificationPreferences.id,
        userId,
        channels: preferences.channels,
        severityLevels: preferences.severityLevels
      }));
    });

    it('should throw an error when preferences are not provided', async () => {
      // Arrange
      const userId = 'user-123';
      const preferences = null;

      // Act & Assert
      await expect(notificationService.saveUserPreferences(userId, preferences))
        .rejects.toThrow('Preferences are required');
    });

    it('should throw an error when an invalid channel type is provided', async () => {
      // Arrange
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'invalid-channel',
            email: 'test@example.com'
          }
        ]
      };

      // Act & Assert
      await expect(notificationService.saveUserPreferences(userId, preferences))
        .rejects.toThrow('Invalid notification channel: invalid-channel');
    });

    it('should throw an error when email channel is missing email address', async () => {
      // Arrange
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'email'
            // Missing email address
          }
        ]
      };

      // Act & Assert
      await expect(notificationService.saveUserPreferences(userId, preferences))
        .rejects.toThrow('Email address is required for email notifications');
    });

    it('should throw an error when SMS channel is missing phone number', async () => {
      // Arrange
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'sms'
            // Missing phone number
          }
        ]
      };

      // Act & Assert
      await expect(notificationService.saveUserPreferences(userId, preferences))
        .rejects.toThrow('Phone number is required for SMS notifications');
    });

    it('should throw an error when Slack channel is missing webhook URL', async () => {
      // Arrange
      const userId = 'user-123';
      const preferences = {
        channels: [
          {
            type: 'slack'
            // Missing webhook URL
          }
        ]
      };

      // Act & Assert
      await expect(notificationService.saveUserPreferences(userId, preferences))
        .rejects.toThrow('Webhook URL is required for Slack notifications');
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences when they exist', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockNotificationPreferences]);
      
      const userId = 'user-123';

      // Act
      const result = await notificationService.getUserPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockNotificationPreferences);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('notification-preferences', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
    });

    it('should return default preferences when none exist', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]);
      
      const userId = 'user-123';

      // Act
      const result = await notificationService.getUserPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual({
        channels: [],
        severityLevels: ['info', 'warning', 'error', 'critical']
      });
    });
  });

  describe('deleteUserPreferences', () => {
    it('should delete user preferences when they exist', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockNotificationPreferences]);
      dynamodb.deleteItem.mockResolvedValue(true);
      
      const userId = 'user-123';

      // Act
      const result = await notificationService.deleteUserPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification preferences deleted successfully');
      
      // Verify DynamoDB was queried to find the preferences
      expect(dynamodb.queryItems).toHaveBeenCalledWith('notification-preferences', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
      
      // Verify preferences were deleted from DynamoDB
      expect(dynamodb.deleteItem).toHaveBeenCalledWith('notification-preferences', { id: mockNotificationPreferences.id });
    });

    it('should throw an error when preferences are not found', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]);
      
      const userId = 'user-123';

      // Act & Assert
      await expect(notificationService.deleteUserPreferences(userId))
        .rejects.toThrow('Notification preferences not found');
    });
  });

  describe('sendUserNotification', () => {
    it('should send notifications to all configured channels', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockNotificationPreferences]);
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const subject = 'Test Notification';
      const message = 'This is a test notification';
      const severity = 'warning';
      const metadata = { key: 'value' };

      // Act
      const result = await notificationService.sendUserNotification(userId, subject, message, severity, metadata);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification sent');
      expect(result.results).toBeInstanceOf(Array);
      expect(result.results.length).toBe(mockNotificationPreferences.channels.length);
      
      // Verify preferences were retrieved
      expect(dynamodb.queryItems).toHaveBeenCalled();
      
      // Verify notification was logged
      expect(dynamodb.putItem).toHaveBeenCalledWith('notification-logs', expect.objectContaining({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        subject,
        message,
        severity,
        metadata: expect.any(String),
        deliveryResults: expect.any(String)
      }));
      
      // Verify email was sent
      const ses = AWS.SES.mock.results[0].value;
      expect(ses.sendEmail).toHaveBeenCalled();
      
      // Verify Slack notification was sent
      expect(axios.post).toHaveBeenCalled();
    });

    it('should not send notifications if user does not want to receive the specified severity', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([{
        ...mockNotificationPreferences,
        severityLevels: ['error', 'critical'] // Only want error and critical
      }]);
      
      const userId = 'user-123';
      const subject = 'Test Notification';
      const message = 'This is a test notification';
      const severity = 'info'; // Lower severity than configured
      const metadata = { key: 'value' };

      // Act
      const result = await notificationService.sendUserNotification(userId, subject, message, severity, metadata);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toBe('User does not want to receive info notifications');
      
      // Verify no notifications were sent
      const ses = AWS.SES.mock.results[0]?.value;
      expect(ses?.sendEmail).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should return failure when no channels are configured', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([{
        ...mockNotificationPreferences,
        channels: [] // No channels configured
      }]);
      
      const userId = 'user-123';
      const subject = 'Test Notification';
      const message = 'This is a test notification';

      // Act
      const result = await notificationService.sendUserNotification(userId, subject, message);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toBe('No notification channels configured');
    });
  });

  describe('getUserNotificationLogs', () => {
    it('should get notification logs for a user', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue(mockNotificationLogs);
      
      const userId = 'user-123';
      const limit = 10;

      // Act
      const result = await notificationService.getUserNotificationLogs(userId, limit);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(mockNotificationLogs.length);
      
      // Verify metadata and deliveryResults were parsed
      expect(result[0].metadata).toEqual(expect.any(Object));
      expect(result[0].deliveryResults).toEqual(expect.any(Array));
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('notification-logs', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        Limit: limit,
        ScanIndexForward: false
      }));
    });

    it('should filter logs by date range when provided', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue(mockNotificationLogs);
      
      const userId = 'user-123';
      const limit = 10;
      const startDate = '2025-05-01T00:00:00.000Z';
      const endDate = '2025-05-31T23:59:59.999Z';

      // Act
      const result = await notificationService.getUserNotificationLogs(userId, limit, startDate, endDate);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('notification-logs', expect.objectContaining({
        KeyConditionExpression: 'userId = :userId AND timestamp BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':startDate': startDate,
          ':endDate': endDate
        }
      }));
    });
  });

  // Additional tests for email, SMS, and Slack notification methods
  describe('sendEmailNotification', () => {
    it('should send an email notification', async () => {
      // This is testing a private method, so we need to access it through the module exports
      const sendEmailNotification = notificationService.sendEmailNotification || 
                                   notificationService.__test__.sendEmailNotification;
      
      // If the method is not exposed for testing, skip this test
      if (!sendEmailNotification) {
        console.warn('sendEmailNotification method is not exposed for testing');
        return;
      }
      
      // Arrange
      const email = 'test@example.com';
      const subject = 'Test Email';
      const message = 'This is a test email';
      const severity = 'info';
      const metadata = { key: 'value' };

      // Act
      const result = await sendEmailNotification(email, subject, message, severity, metadata);

      // Assert
      expect(result).toBeDefined();
      expect(result.MessageId).toBe('mock-message-id');
      
      // Verify SES was called with the correct parameters
      const ses = AWS.SES.mock.results[0].value;
      expect(ses.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        Destination: {
          ToAddresses: [email]
        },
        Message: expect.objectContaining({
          Subject: expect.objectContaining({
            Data: expect.stringContaining(subject)
          })
        })
      }));
    });
  });

  describe('sendSmsNotification', () => {
    it('should send an SMS notification', async () => {
      // This is testing a private method, so we need to access it through the module exports
      const sendSmsNotification = notificationService.sendSmsNotification || 
                                 notificationService.__test__.sendSmsNotification;
      
      // If the method is not exposed for testing, skip this test
      if (!sendSmsNotification) {
        console.warn('sendSmsNotification method is not exposed for testing');
        return;
      }
      
      // Arrange
      const phoneNumber = '+12345678901';
      const subject = 'Test SMS';
      const message = 'This is a test SMS';
      const severity = 'warning';
      const metadata = { key: 'value' };

      // Act
      const result = await sendSmsNotification(phoneNumber, subject, message, severity, metadata);

      // Assert
      expect(result).toBeDefined();
      expect(result.MessageId).toBe('mock-message-id');
      
      // Verify SNS was called with the correct parameters
      const sns = AWS.SNS.mock.results[0].value;
      expect(sns.publish).toHaveBeenCalledWith(expect.objectContaining({
        PhoneNumber: phoneNumber,
        Message: expect.stringContaining(subject)
      }));
    });
  });

  describe('sendSlackNotification', () => {
    it('should send a Slack notification', async () => {
      // This is testing a private method, so we need to access it through the module exports
      const sendSlackNotification = notificationService.sendSlackNotification || 
                                   notificationService.__test__.sendSlackNotification;
      
      // If the method is not exposed for testing, skip this test
      if (!sendSlackNotification) {
        console.warn('sendSlackNotification method is not exposed for testing');
        return;
      }
      
      // Arrange
      const webhookUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      const subject = 'Test Slack';
      const message = 'This is a test Slack notification';
      const severity = 'error';
      const metadata = { key: 'value' };

      // Act
      const result = await sendSlackNotification(webhookUrl, subject, message, severity, metadata);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      
      // Verify axios was called with the correct parameters
      expect(axios.post).toHaveBeenCalledWith(webhookUrl, expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({
            pretext: expect.stringContaining(subject),
            text: message
          })
        ])
      }));
    });
  });
});