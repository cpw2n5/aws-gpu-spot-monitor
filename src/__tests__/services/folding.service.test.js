const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const foldingService = require('../../services/folding.service');
const instanceService = require('../../services/instance.service');
const { mockFoldingConfig, mockFoldingStats, mockFoldingStatus, mockInstance } = require('../utils/mockData');
const { resetMocks } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/logger', () => require('../mocks/logger.mock'));
jest.mock('../../utils/dynamodb', () => require('../mocks/dynamodb.mock'));
jest.mock('../../utils/folding-metrics', () => require('../mocks/folding-metrics.mock'));
jest.mock('../../services/instance.service');
jest.mock('uuid');

describe('Folding Service', () => {
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
    
    // Mock instanceService
    instanceService.getInstance.mockResolvedValue(mockInstance);
  });

  describe('saveConfiguration', () => {
    it('should create a new configuration when none exists', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]); // No existing config
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const config = {
        user: 'testuser',
        team: '12345',
        passkey: 'abc123',
        power: 'full'
      };

      // Act
      const result = await foldingService.saveConfiguration(userId, config);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.userId).toBe(userId);
      expect(result.user).toBe(config.user);
      expect(result.team).toBe(config.team);
      expect(result.passkey).toBe(config.passkey);
      expect(result.power).toBe(config.power);
      
      // Verify DynamoDB was queried to check for existing config
      expect(dynamodb.queryItems).toHaveBeenCalledWith('folding-config', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
      
      // Verify config was stored in DynamoDB
      expect(dynamodb.putItem).toHaveBeenCalledWith('folding-config', expect.objectContaining({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        user: config.user,
        team: config.team,
        passkey: config.passkey,
        power: config.power
      }));
    });

    it('should update an existing configuration', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockFoldingConfig]); // Existing config
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const config = {
        user: 'newuser',
        team: '54321',
        passkey: 'xyz789',
        power: 'medium'
      };

      // Act
      const result = await foldingService.saveConfiguration(userId, config);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockFoldingConfig.id); // Should keep the same ID
      expect(result.userId).toBe(userId);
      expect(result.user).toBe(config.user);
      expect(result.team).toBe(config.team);
      expect(result.passkey).toBe(config.passkey);
      expect(result.power).toBe(config.power);
      
      // Verify config was updated in DynamoDB
      expect(dynamodb.putItem).toHaveBeenCalledWith('folding-config', expect.objectContaining({
        id: mockFoldingConfig.id,
        userId,
        user: config.user,
        team: config.team,
        passkey: config.passkey,
        power: config.power
      }));
    });

    it('should throw an error when configuration is not provided', async () => {
      // Arrange
      const userId = 'user-123';
      const config = null;

      // Act & Assert
      await expect(foldingService.saveConfiguration(userId, config))
        .rejects.toThrow('Configuration is required');
    });
  });

  describe('getConfiguration', () => {
    it('should get user configuration when it exists', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockFoldingConfig]);
      
      const userId = 'user-123';

      // Act
      const result = await foldingService.getConfiguration(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockFoldingConfig);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('folding-config', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
    });

    it('should return default configuration when none exists', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]);
      
      const userId = 'user-123';

      // Act
      const result = await foldingService.getConfiguration(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual({
        user: 'anonymous',
        team: '0',
        passkey: '',
        power: 'full'
      });
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete user configuration when it exists', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockFoldingConfig]);
      dynamodb.deleteItem.mockResolvedValue(true);
      
      const userId = 'user-123';

      // Act
      const result = await foldingService.deleteConfiguration(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuration deleted successfully');
      
      // Verify DynamoDB was queried to find the config
      expect(dynamodb.queryItems).toHaveBeenCalledWith('folding-config', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
      
      // Verify config was deleted from DynamoDB
      expect(dynamodb.deleteItem).toHaveBeenCalledWith('folding-config', { id: mockFoldingConfig.id });
    });

    it('should throw an error when configuration is not found', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]);
      
      const userId = 'user-123';

      // Act & Assert
      await expect(foldingService.deleteConfiguration(userId))
        .rejects.toThrow('Configuration not found');
    });
  });

  describe('applyConfigurationToInstance', () => {
    it('should apply configuration to an instance', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([mockFoldingConfig]);
      dynamodb.updateItem.mockResolvedValue({
        ...mockInstance,
        foldingConfig: JSON.stringify(mockFoldingConfig),
        updatedAt: new Date().toISOString()
      });
      
      const userId = 'user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await foldingService.applyConfigurationToInstance(userId, instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuration applied successfully');
      expect(result.instance).toBeDefined();
      expect(result.instance.foldingConfig).toEqual(mockFoldingConfig);
      
      // Verify instance was retrieved
      expect(instanceService.getInstance).toHaveBeenCalledWith(instanceId);
      
      // Verify configuration was retrieved
      expect(dynamodb.queryItems).toHaveBeenCalled();
      
      // Verify instance was updated in DynamoDB
      expect(dynamodb.updateItem).toHaveBeenCalledWith(
        'instances',
        { id: instanceId },
        'SET foldingConfig = :foldingConfig, updatedAt = :updatedAt',
        expect.objectContaining({
          ':foldingConfig': expect.any(String),
          ':updatedAt': expect.any(String)
        })
      );
    });

    it('should throw an error when user does not own the instance', async () => {
      // Arrange
      instanceService.getInstance.mockResolvedValue({
        ...mockInstance,
        userId: 'different-user'
      });
      
      const userId = 'user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act & Assert
      await expect(foldingService.applyConfigurationToInstance(userId, instanceId))
        .rejects.toThrow('You do not have permission to update this instance');
    });
  });

  describe('getStats', () => {
    it('should get Folding@Home stats for a user', async () => {
      // Arrange
      const user = 'testuser';
      const team = '12345';

      // Act
      const result = await foldingService.getStats(user, team);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBe(user);
      expect(result.team).toBe(team);
      expect(result.score).toBe(1000000);
      expect(result.wus).toBe(500);
      expect(result.rank).toBe(10000);
      expect(result.active_clients).toBe(2);
      
      // Verify API was called
      expect(axios.get).toHaveBeenCalledWith(`https://stats.foldingathome.org/api/donor/${user}`);
    });

    it('should return default stats when API call fails', async () => {
      // Arrange
      axios.get.mockRejectedValue(new Error('API error'));
      
      const user = 'testuser';
      const team = '12345';

      // Act
      const result = await foldingService.getStats(user, team);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBe(user);
      expect(result.team).toBe(team);
      expect(result.score).toBe(0);
      expect(result.wus).toBe(0);
      expect(result.rank).toBe(0);
      expect(result.active_clients).toBe(0);
      expect(result.error).toBe('Failed to fetch stats from Folding@Home API');
    });
  });

  describe('getInstanceStatus', () => {
    it('should get Folding@Home status for an active instance', async () => {
      // Arrange
      const foldingMetrics = require('../../utils/folding-metrics');
      foldingMetrics.publishFoldingMetrics.mockResolvedValue(true);
      foldingMetrics.publishSpotInstanceMetrics.mockResolvedValue(true);
      
      // Mock getStats
      const originalGetStats = foldingService.getStats;
      foldingService.getStats = jest.fn().mockResolvedValue(mockFoldingStats);
      
      const userId = 'user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await foldingService.getInstanceStatus(userId, instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.instanceId).toBe(instanceId);
      expect(result.status).toBe('running');
      expect(result.config).toEqual(JSON.parse(mockInstance.foldingConfig));
      expect(result.stats).toEqual(mockFoldingStats);
      expect(result.healthScore).toBeGreaterThan(0);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
      
      // Verify instance was retrieved
      expect(instanceService.getInstance).toHaveBeenCalledWith(instanceId);
      
      // Verify stats were retrieved
      expect(foldingService.getStats).toHaveBeenCalled();
      
      // Verify metrics were published
      expect(foldingMetrics.publishFoldingMetrics).toHaveBeenCalled();
      expect(foldingMetrics.publishSpotInstanceMetrics).toHaveBeenCalled();
      
      // Restore original getStats
      foldingService.getStats = originalGetStats;
    });

    it('should return not_configured status when instance has no folding config', async () => {
      // Arrange
      instanceService.getInstance.mockResolvedValue({
        ...mockInstance,
        foldingConfig: null
      });
      
      const userId = 'user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await foldingService.getInstanceStatus(userId, instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.instanceId).toBe(instanceId);
      expect(result.status).toBe('not_configured');
      expect(result.message).toBe('Folding@Home is not configured for this instance');
    });

    it('should throw an error when user does not own the instance', async () => {
      // Arrange
      instanceService.getInstance.mockResolvedValue({
        ...mockInstance,
        userId: 'different-user'
      });
      
      const userId = 'user-123';
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act & Assert
      await expect(foldingService.getInstanceStatus(userId, instanceId))
        .rejects.toThrow('You do not have permission to access this instance');
    });
  });
});