const { 
  EC2Client, 
  RequestSpotInstancesCommand,
  DescribeSpotInstanceRequestsCommand,
  CancelSpotInstanceRequestsCommand,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
  CreateTagsCommand
} = require('@aws-sdk/client-ec2');
const { v4: uuidv4 } = require('uuid');
const instanceService = require('../../services/instance.service');
const spotPriceService = require('../../services/spotPrice.service');
const { mockInstance, mockInstances, mockAwsResponses } = require('../utils/mockData');
const { resetMocks } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../utils/logger', () => require('../mocks/logger.mock'));
jest.mock('../../utils/dynamodb', () => require('../mocks/dynamodb.mock'));
jest.mock('../../services/spotPrice.service');
jest.mock('uuid');

describe('Instance Service', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock UUID generation
    uuidv4.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
    
    // Mock spotPriceService methods
    spotPriceService.getSupportedInstanceTypes.mockReturnValue(['p3.2xlarge', 'g4dn.xlarge']);
    spotPriceService.getSupportedRegions.mockReturnValue(['us-east-1', 'us-west-2']);
    
    // Mock EC2Client implementation
    EC2Client.mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command instanceof RequestSpotInstancesCommand) {
          return Promise.resolve({
            SpotInstanceRequests: [{
              SpotInstanceRequestId: 'sir-123456',
              State: 'open',
              Status: {
                Code: 'pending-evaluation',
                Message: 'Your Spot request is pending evaluation.'
              }
            }]
          });
        }
        if (command instanceof DescribeSpotInstanceRequestsCommand) {
          return Promise.resolve(mockAwsResponses.spotInstanceRequest);
        }
        if (command instanceof DescribeInstancesCommand) {
          return Promise.resolve(mockAwsResponses.ec2Instance);
        }
        if (command instanceof CancelSpotInstanceRequestsCommand) {
          return Promise.resolve({});
        }
        if (command instanceof TerminateInstancesCommand) {
          return Promise.resolve({});
        }
        if (command instanceof CreateTagsCommand) {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      })
    }));
  });

  describe('requestSpotInstance', () => {
    it('should request a new spot instance with the provided parameters', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const instanceType = 'p3.2xlarge';
      const region = 'us-east-1';
      const maxPrice = 1.5;

      // Act
      const result = await instanceService.requestSpotInstance(
        userId, instanceType, region, maxPrice
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.instanceId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.spotRequestId).toBe('sir-123456');
      expect(result.region).toBe(region);
      expect(result.instanceType).toBe(instanceType);
      expect(result.maxPrice).toBe(maxPrice);
      
      // Verify EC2Client was called with the correct region
      expect(EC2Client).toHaveBeenCalledWith({ region });
      
      // Verify spot instance request was made
      const ec2Client = EC2Client.mock.results[0].value;
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(RequestSpotInstancesCommand));
      
      // Verify tags were created
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(CreateTagsCommand));
      
      // Verify instance was stored in DynamoDB
      expect(dynamodb.putItem).toHaveBeenCalledWith('instances', expect.objectContaining({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        spotRequestId: 'sir-123456',
        region,
        instanceType,
        maxPrice: maxPrice
      }));
    });

    it('should request a spot instance with Folding@Home configuration when provided', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      
      const userId = 'user-123';
      const instanceType = 'p3.2xlarge';
      const region = 'us-east-1';
      const maxPrice = 1.5;
      const foldingConfig = {
        user: 'testuser',
        team: '12345',
        passkey: 'abc123',
        power: 'full'
      };

      // Act
      const result = await instanceService.requestSpotInstance(
        userId, instanceType, region, maxPrice, null, null, null, foldingConfig
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.foldingConfig).toEqual(foldingConfig);
      
      // Verify instance was stored in DynamoDB with folding config
      expect(dynamodb.putItem).toHaveBeenCalledWith('instances', expect.objectContaining({
        foldingConfig: JSON.stringify(foldingConfig)
      }));
    });

    it('should throw an error when an invalid instance type is provided', async () => {
      // Arrange
      const userId = 'user-123';
      const invalidInstanceType = 'invalid-instance-type';
      const region = 'us-east-1';
      const maxPrice = 1.5;

      // Act & Assert
      await expect(instanceService.requestSpotInstance(
        userId, invalidInstanceType, region, maxPrice
      )).rejects.toThrow(`Invalid instance type: ${invalidInstanceType}`);
    });

    it('should throw an error when an invalid region is provided', async () => {
      // Arrange
      const userId = 'user-123';
      const instanceType = 'p3.2xlarge';
      const invalidRegion = 'invalid-region';
      const maxPrice = 1.5;

      // Act & Assert
      await expect(instanceService.requestSpotInstance(
        userId, instanceType, invalidRegion, maxPrice
      )).rejects.toThrow(`Invalid region: ${invalidRegion}`);
    });
  });

  describe('getInstance', () => {
    it('should get instance details by ID', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(mockInstance);
      
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await instanceService.getInstance(instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(instanceId);
      expect(result.userId).toBe(mockInstance.userId);
      expect(result.spotRequestId).toBe(mockInstance.spotRequestId);
      expect(result.foldingConfig).toEqual(JSON.parse(mockInstance.foldingConfig));
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.getItem).toHaveBeenCalledWith('instances', { id: instanceId });
    });

    it('should throw an error when instance is not found', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(null);
      
      const instanceId = 'non-existent-id';

      // Act & Assert
      await expect(instanceService.getInstance(instanceId))
        .rejects.toThrow(`Instance not found: ${instanceId}`);
    });
  });

  describe('listInstances', () => {
    it('should list instances for a user', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue(mockInstances);
      
      const userId = 'user-123';

      // Act
      const result = await instanceService.listInstances(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(mockInstances.length);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('instances', expect.objectContaining({
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
      
      // Verify folding config was parsed
      expect(result[0].foldingConfig).toEqual(JSON.parse(mockInstances[0].foldingConfig));
    });
  });

  describe('updateInstanceStatus', () => {
    it('should update instance status from AWS', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(mockInstance);
      dynamodb.updateItem.mockResolvedValue({
        ...mockInstance,
        status: 'active',
        statusCode: 'fulfilled',
        statusMessage: 'Your Spot request is fulfilled.',
        ec2InstanceId: 'i-12345678',
        publicDnsName: 'ec2-12-34-56-78.compute-1.amazonaws.com',
        publicIpAddress: '12.34.56.78',
        updatedAt: new Date().toISOString()
      });
      
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await instanceService.updateInstanceStatus(instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('active');
      expect(result.ec2InstanceId).toBe('i-12345678');
      expect(result.publicDnsName).toBe('ec2-12-34-56-78.compute-1.amazonaws.com');
      expect(result.publicIpAddress).toBe('12.34.56.78');
      
      // Verify EC2Client was called with the correct region
      expect(EC2Client).toHaveBeenCalledWith({ region: mockInstance.region });
      
      // Verify spot instance request was described
      const ec2Client = EC2Client.mock.results[0].value;
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(DescribeSpotInstanceRequestsCommand));
      
      // Verify EC2 instance was described
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(DescribeInstancesCommand));
      
      // Verify instance was updated in DynamoDB
      expect(dynamodb.updateItem).toHaveBeenCalled();
    });

    it('should throw an error when instance is not found', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(null);
      
      const instanceId = 'non-existent-id';

      // Act & Assert
      await expect(instanceService.updateInstanceStatus(instanceId))
        .rejects.toThrow(`Instance not found: ${instanceId}`);
    });
  });

  describe('terminateInstance', () => {
    it('should terminate an instance and cancel spot request', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(mockInstance);
      dynamodb.updateItem.mockResolvedValue({
        ...mockInstance,
        status: 'cancelled',
        statusCode: 'terminated-by-user',
        statusMessage: 'Instance terminated by user',
        updatedAt: new Date().toISOString()
      });
      
      const instanceId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = await instanceService.terminateInstance(instanceId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Instance terminated successfully');
      expect(result.instance.status).toBe('cancelled');
      
      // Verify EC2Client was called with the correct region
      expect(EC2Client).toHaveBeenCalledWith({ region: mockInstance.region });
      
      // Verify spot request was cancelled
      const ec2Client = EC2Client.mock.results[0].value;
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(CancelSpotInstanceRequestsCommand));
      
      // Verify EC2 instance was terminated
      expect(ec2Client.send).toHaveBeenCalledWith(expect.any(TerminateInstancesCommand));
      
      // Verify instance was updated in DynamoDB
      expect(dynamodb.updateItem).toHaveBeenCalled();
    });

    it('should throw an error when instance is not found', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.getItem.mockResolvedValue(null);
      
      const instanceId = 'non-existent-id';

      // Act & Assert
      await expect(instanceService.terminateInstance(instanceId))
        .rejects.toThrow(`Instance not found: ${instanceId}`);
    });
  });
});