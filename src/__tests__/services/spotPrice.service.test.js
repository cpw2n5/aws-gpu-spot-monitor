const { EC2Client, DescribeSpotPriceHistoryCommand } = require('@aws-sdk/client-ec2');
const { v4: uuidv4 } = require('uuid');
const spotPriceService = require('../../services/spotPrice.service');
const { mockSpotPrices, mockSpotPriceHistory, mockAwsResponses } = require('../utils/mockData');
const { resetMocks } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../utils/logger', () => require('../mocks/logger.mock'));
jest.mock('../../utils/dynamodb', () => require('../mocks/dynamodb.mock'));
jest.mock('../../utils/folding-metrics', () => require('../mocks/folding-metrics.mock'));
jest.mock('uuid');

describe('Spot Price Service', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock UUID generation
    uuidv4.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
    
    // Mock EC2Client implementation
    EC2Client.mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command instanceof DescribeSpotPriceHistoryCommand) {
          return Promise.resolve(mockAwsResponses.spotPriceHistory);
        }
        return Promise.resolve({});
      })
    }));
  });

  describe('getCurrentSpotPrices', () => {
    it('should get current spot prices for all regions and instance types when no parameters are provided', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      dynamodb.queryItems.mockResolvedValue([]);
      
      const foldingMetrics = require('../../utils/folding-metrics');
      foldingMetrics.publishSpotPriceMetrics.mockResolvedValue({ 
        priceChangePercent: 0, 
        anomalyScore: 0.1 
      });

      // Act
      const result = await spotPriceService.getCurrentSpotPrices();

      // Assert
      expect(result).toBeDefined();
      expect(result.prices).toBeInstanceOf(Array);
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      
      // Verify EC2Client was called for each region
      expect(EC2Client).toHaveBeenCalledTimes(spotPriceService.getSupportedRegions().length);
      
      // Verify DynamoDB was called to store prices
      expect(dynamodb.putItem).toHaveBeenCalled();
      
      // Verify metrics were published
      expect(foldingMetrics.publishSpotPriceMetrics).toHaveBeenCalled();
    });

    it('should get current spot prices for a specific region when region parameter is provided', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      dynamodb.queryItems.mockResolvedValue([]);
      
      const foldingMetrics = require('../../utils/folding-metrics');
      foldingMetrics.publishSpotPriceMetrics.mockResolvedValue({ 
        priceChangePercent: 0, 
        anomalyScore: 0.1 
      });

      const region = 'us-east-1';

      // Act
      const result = await spotPriceService.getCurrentSpotPrices(region);

      // Assert
      expect(result).toBeDefined();
      expect(result.prices).toBeInstanceOf(Array);
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      
      // Verify EC2Client was called only for the specified region
      expect(EC2Client).toHaveBeenCalledTimes(1);
      expect(EC2Client).toHaveBeenCalledWith({ region: 'us-east-1' });
    });

    it('should get current spot prices for a specific instance type when instanceType parameter is provided', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      dynamodb.queryItems.mockResolvedValue([]);
      
      const foldingMetrics = require('../../utils/folding-metrics');
      foldingMetrics.publishSpotPriceMetrics.mockResolvedValue({ 
        priceChangePercent: 0, 
        anomalyScore: 0.1 
      });

      const instanceType = 'p3.2xlarge';

      // Act
      const result = await spotPriceService.getCurrentSpotPrices(null, instanceType);

      // Assert
      expect(result).toBeDefined();
      expect(result.prices).toBeInstanceOf(Array);
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      
      // Verify EC2Client was called for each region
      expect(EC2Client).toHaveBeenCalledTimes(spotPriceService.getSupportedRegions().length);
      
      // Verify the command was called with the correct instance type
      const command = new DescribeSpotPriceHistoryCommand({
        InstanceTypes: [instanceType],
        ProductDescriptions: ['Linux/UNIX'],
        StartTime: expect.any(Date)
      });
      
      const ec2Client = EC2Client.mock.results[0].value;
      expect(ec2Client.send).toHaveBeenCalledWith(expect.objectContaining({
        input: expect.objectContaining({
          InstanceTypes: [instanceType]
        })
      }));
    });

    it('should throw an error when an invalid region is provided', async () => {
      // Arrange
      const invalidRegion = 'invalid-region';

      // Act & Assert
      await expect(spotPriceService.getCurrentSpotPrices(invalidRegion))
        .rejects.toThrow(`Invalid region: ${invalidRegion}`);
    });

    it('should throw an error when an invalid instance type is provided', async () => {
      // Arrange
      const invalidInstanceType = 'invalid-instance-type';

      // Act & Assert
      await expect(spotPriceService.getCurrentSpotPrices(null, invalidInstanceType))
        .rejects.toThrow(`Invalid instance type: ${invalidInstanceType}`);
    });

    it('should detect and report price anomalies when significant price changes occur', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.putItem.mockResolvedValue({});
      
      // Mock previous price data with a significant difference
      dynamodb.queryItems.mockResolvedValue([
        { price: 0.5 } // Previous price is much lower than current price
      ]);
      
      const foldingMetrics = require('../../utils/folding-metrics');
      foldingMetrics.publishSpotPriceMetrics.mockResolvedValue({ 
        priceChangePercent: 100, // 100% increase
        anomalyScore: 0.8 // High anomaly score
      });

      // Act
      const result = await spotPriceService.getCurrentSpotPrices('us-east-1', 'p3.2xlarge');

      // Assert
      expect(result).toBeDefined();
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.anomalies.length).toBeGreaterThan(0);
      
      // Verify logger was called with warning
      const logger = require('../../utils/logger');
      expect(logger.warn).toHaveBeenCalledWith('Spot price anomalies detected', expect.any(Object));
    });
  });

  describe('getSpotPriceHistory', () => {
    it('should get spot price history for a specific instance type', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue(mockSpotPriceHistory);
      
      const instanceType = 'p3.2xlarge';
      const days = 7;

      // Act
      const result = await spotPriceService.getSpotPriceHistory(instanceType, null, days);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(mockSpotPriceHistory.length);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('spot-price-history', expect.objectContaining({
        IndexName: 'InstanceTypeTimestampIndex',
        KeyConditionExpression: 'instanceType = :instanceType AND timestamp >= :startTimestamp',
        ExpressionAttributeValues: expect.objectContaining({
          ':instanceType': instanceType
        })
      }));
    });

    it('should get spot price history for a specific instance type and region', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue(mockSpotPriceHistory);
      
      const instanceType = 'p3.2xlarge';
      const region = 'us-east-1';
      const days = 7;

      // Act
      const result = await spotPriceService.getSpotPriceHistory(instanceType, region, days);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(mockSpotPriceHistory.length);
      
      // Verify DynamoDB was queried with the correct parameters
      expect(dynamodb.queryItems).toHaveBeenCalledWith('spot-price-history', expect.objectContaining({
        IndexName: 'InstanceTypeTimestampIndex',
        KeyConditionExpression: 'instanceType = :instanceType AND timestamp >= :startTimestamp',
        FilterExpression: 'region = :region',
        ExpressionAttributeValues: expect.objectContaining({
          ':instanceType': instanceType,
          ':region': region
        })
      }));
    });

    it('should fetch spot price history from AWS when no data is found in DynamoDB', async () => {
      // Arrange
      const dynamodb = require('../../utils/dynamodb');
      dynamodb.queryItems.mockResolvedValue([]); // No data in DynamoDB
      dynamodb.putItem.mockResolvedValue({});
      
      const instanceType = 'p3.2xlarge';
      const region = 'us-east-1';
      const days = 7;

      // Act
      const result = await spotPriceService.getSpotPriceHistory(instanceType, region, days);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      
      // Verify EC2Client was called to fetch data from AWS
      expect(EC2Client).toHaveBeenCalledWith({ region: 'us-east-1' });
      
      // Verify DynamoDB was called to store the fetched data
      expect(dynamodb.putItem).toHaveBeenCalled();
    });

    it('should throw an error when an invalid instance type is provided', async () => {
      // Arrange
      const invalidInstanceType = 'invalid-instance-type';

      // Act & Assert
      await expect(spotPriceService.getSpotPriceHistory(invalidInstanceType))
        .rejects.toThrow(`Invalid instance type: ${invalidInstanceType}`);
    });

    it('should throw an error when an invalid region is provided', async () => {
      // Arrange
      const instanceType = 'p3.2xlarge';
      const invalidRegion = 'invalid-region';

      // Act & Assert
      await expect(spotPriceService.getSpotPriceHistory(instanceType, invalidRegion))
        .rejects.toThrow(`Invalid region: ${invalidRegion}`);
    });
  });

  describe('getSupportedInstanceTypes', () => {
    it('should return a list of supported GPU instance types', () => {
      // Act
      const result = spotPriceService.getSupportedInstanceTypes();

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('p3.2xlarge');
      expect(result).toContain('g4dn.xlarge');
    });
  });

  describe('getSupportedRegions', () => {
    it('should return a list of supported AWS regions', () => {
      // Act
      const result = spotPriceService.getSupportedRegions();

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('us-east-1');
      expect(result).toContain('us-west-2');
    });
  });
});