/**
 * Integration tests for key workflows
 * 
 * These tests verify the integration between different services and components
 * in the application. They test complete workflows from end to end.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const spotPriceService = require('../../services/spotPrice.service');
const instanceService = require('../../services/instance.service');
const foldingService = require('../../services/folding.service');
const notificationService = require('../../services/notification.service');
const { mockInstance, mockFoldingConfig } = require('../utils/mockData');
const { resetMocks } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/logger', () => require('../mocks/logger.mock'));
jest.mock('../../utils/dynamodb', () => require('../mocks/dynamodb.mock'));
jest.mock('../../utils/folding-metrics', () => require('../mocks/folding-metrics.mock'));
jest.mock('@aws-sdk/client-ec2');
jest.mock('uuid');

describe('Integration Tests - Key Workflows', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock UUID generation
    uuidv4.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
    
    // Mock axios
    axios.get.mockResolvedValue({
      data: {
        credit: 1000000,
        wus: 500,
        rank: 10000,
        active_clients: 2
      }
    });
    
    // Populate mock database
    const dynamodb = require('../../utils/dynamodb');
    dynamodb.resetMockDatabase();
  });

  describe('Spot Instance Deployment Workflow', () => {
    it('should successfully deploy a spot instance with Folding@Home configuration', async () => {
      // Step 1: Get current spot prices to determine the best region and instance type
      const spotPrices = await spotPriceService.getCurrentSpotPrices();
      expect(spotPrices).toBeDefined();
      expect(spotPrices.prices).toBeInstanceOf(Array);
      
      // Find the cheapest instance type in a region
      const sortedPrices = [...spotPrices.prices].sort((a, b) => a.price - b.price);
      const cheapestSpot = sortedPrices[0];
      
      // Step 2: Request a spot instance
      const userId = 'test-user-123';
      const instanceType = cheapestSpot.instanceType;
      const region = cheapestSpot.region;
      const maxPrice = cheapestSpot.price * 1.2; // 20% higher than current price
      
      const instance = await instanceService.requestSpotInstance(
        userId, instanceType, region, maxPrice
      );
      
      expect(instance).toBeDefined();
      expect(instance.instanceId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(instance.spotRequestId).toBeDefined();
      expect(instance.region).toBe(region);
      expect(instance.instanceType).toBe(instanceType);
      
      // Step 3: Save Folding@Home configuration
      const foldingConfig = {
        user: 'testuser',
        team: '12345',
        passkey: 'abc123',
        power: 'full'
      };
      
      const savedConfig = await foldingService.saveConfiguration(userId, foldingConfig);
      expect(savedConfig).toBeDefined();
      expect(savedConfig.userId).toBe(userId);
      expect(savedConfig.user).toBe(foldingConfig.user);
      
      // Step 4: Apply Folding@Home configuration to the instance
      const appliedConfig = await foldingService.applyConfigurationToInstance(
        userId, instance.instanceId
      );
      
      expect(appliedConfig).toBeDefined();
      expect(appliedConfig.success).toBe(true);
      expect(appliedConfig.instance).toBeDefined();
      expect(appliedConfig.instance.foldingConfig).toBeDefined();
      
      // Step 5: Update instance status
      const updatedInstance = await instanceService.updateInstanceStatus(instance.instanceId);
      expect(updatedInstance).toBeDefined();
      
      // Step 6: Get Folding@Home status for the instance
      const foldingStatus = await foldingService.getInstanceStatus(userId, instance.instanceId);
      expect(foldingStatus).toBeDefined();
      expect(foldingStatus.instanceId).toBe(instance.instanceId);
    });
  });

  describe('Folding@Home Monitoring Workflow', () => {
    it('should successfully monitor Folding@Home status and stats', async () => {
      // Setup: Create a test instance with Folding@Home configuration
      const userId = 'test-user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Populate mock database with a test instance
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem('instances', {
        ...mockInstance,
        id: instanceId,
        userId: userId
      });
      
      // Step 1: Save Folding@Home configuration
      const foldingConfig = {
        user: 'testuser',
        team: '12345',
        passkey: 'abc123',
        power: 'full'
      };
      
      const savedConfig = await foldingService.saveConfiguration(userId, foldingConfig);
      expect(savedConfig).toBeDefined();
      expect(savedConfig.userId).toBe(userId);
      
      // Step 2: Apply configuration to the instance
      const appliedConfig = await foldingService.applyConfigurationToInstance(
        userId, instanceId
      );
      
      expect(appliedConfig).toBeDefined();
      expect(appliedConfig.success).toBe(true);
      
      // Step 3: Get Folding@Home stats
      const stats = await foldingService.getStats(foldingConfig.user, foldingConfig.team);
      expect(stats).toBeDefined();
      expect(stats.user).toBe(foldingConfig.user);
      expect(stats.team).toBe(foldingConfig.team);
      expect(stats.score).toBeDefined();
      expect(stats.wus).toBeDefined();
      
      // Step 4: Get Folding@Home status for the instance
      const foldingStatus = await foldingService.getInstanceStatus(userId, instanceId);
      expect(foldingStatus).toBeDefined();
      expect(foldingStatus.instanceId).toBe(instanceId);
      expect(foldingStatus.config).toBeDefined();
      expect(foldingStatus.stats).toBeDefined();
      expect(foldingStatus.progress).toBeDefined();
      
      // Step 5: Verify metrics are published
      const foldingMetrics = require('../../utils/folding-metrics');
      expect(foldingMetrics.publishFoldingMetrics).toHaveBeenCalled();
      expect(foldingMetrics.publishSpotInstanceMetrics).toHaveBeenCalled();
    });
  });

  describe('Notification System Workflow', () => {
    it('should successfully send notifications based on user preferences', async () => {
      // Setup: Create a test user with notification preferences
      const userId = 'test-user-123';
      
      // Step 1: Save notification preferences
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
        severityLevels: ['info', 'warning', 'error', 'critical']
      };
      
      const savedPreferences = await notificationService.saveUserPreferences(userId, preferences);
      expect(savedPreferences).toBeDefined();
      expect(savedPreferences.userId).toBe(userId);
      expect(savedPreferences.channels).toEqual(preferences.channels);
      
      // Step 2: Send a notification
      const subject = 'Test Notification';
      const message = 'This is a test notification';
      const severity = 'warning';
      const metadata = {
        instanceType: 'p3.2xlarge',
        region: 'us-east-1',
        price: 1.2345
      };
      
      const notificationResult = await notificationService.sendUserNotification(
        userId, subject, message, severity, metadata
      );
      
      expect(notificationResult).toBeDefined();
      expect(notificationResult.success).toBe(true);
      expect(notificationResult.results).toBeInstanceOf(Array);
      expect(notificationResult.results.length).toBe(preferences.channels.length);
      
      // Step 3: Get notification logs
      const logs = await notificationService.getUserNotificationLogs(userId);
      expect(logs).toBeDefined();
      expect(logs).toBeInstanceOf(Array);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].userId).toBe(userId);
      expect(logs[0].subject).toBe(subject);
      expect(logs[0].severity).toBe(severity);
    });
    
    it('should not send notifications for severity levels the user has opted out of', async () => {
      // Setup: Create a test user with notification preferences
      const userId = 'test-user-123';
      
      // Step 1: Save notification preferences with limited severity levels
      const preferences = {
        channels: [
          {
            type: 'email',
            email: 'test@example.com'
          }
        ],
        severityLevels: ['error', 'critical'] // Only want error and critical
      };
      
      const savedPreferences = await notificationService.saveUserPreferences(userId, preferences);
      expect(savedPreferences).toBeDefined();
      
      // Step 2: Try to send a notification with a severity level the user has opted out of
      const subject = 'Test Notification';
      const message = 'This is a test notification';
      const severity = 'info'; // Lower severity than configured
      
      const notificationResult = await notificationService.sendUserNotification(
        userId, subject, message, severity
      );
      
      expect(notificationResult).toBeDefined();
      expect(notificationResult.success).toBe(false);
      expect(notificationResult.message).toBe('User does not want to receive info notifications');
    });
  });
});