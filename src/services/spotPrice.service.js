const {
  EC2Client,
  DescribeSpotPriceHistoryCommand
} = require('@aws-sdk/client-ec2');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const dynamodb = require('../utils/dynamodb');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const foldingMetrics = require('../utils/folding-metrics');

// Initialize the EC2 client
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Define GPU instance types
const GPU_INSTANCE_TYPES = [
  // P2 series (NVIDIA K80 GPUs)
  'p2.xlarge', 'p2.8xlarge', 'p2.16xlarge',
  
  // P3 series (NVIDIA V100 GPUs)
  'p3.2xlarge', 'p3.8xlarge', 'p3.16xlarge',
  'p3dn.24xlarge',
  
  // P4 series (NVIDIA A100 GPUs)
  'p4d.24xlarge',
  'p4de.24xlarge', // Enhanced A100 instances with 80GB GPU memory
  
  // P5 series (NVIDIA H100 GPUs)
  'p5.8xlarge', 'p5.16xlarge', 'p5.24xlarge', 'p5.48xlarge',
  
  // G3 series (NVIDIA M60 GPUs)
  'g3.4xlarge', 'g3.8xlarge', 'g3.16xlarge',
  'g3s.xlarge',
  
  // G4 series (NVIDIA T4 GPUs)
  'g4dn.xlarge', 'g4dn.2xlarge', 'g4dn.4xlarge', 'g4dn.8xlarge', 'g4dn.16xlarge', 'g4dn.12xlarge', 'g4dn.metal',
  
  // G5 series (NVIDIA A10G GPUs)
  'g5.xlarge', 'g5.2xlarge', 'g5.4xlarge', 'g5.8xlarge', 'g5.16xlarge', 'g5.12xlarge', 'g5.24xlarge', 'g5.48xlarge',
  
  // G6 series (NVIDIA L4 GPUs)
  'g6.xlarge', 'g6.2xlarge', 'g6.4xlarge', 'g6.8xlarge', 'g6.12xlarge', 'g6.16xlarge', 'g6.24xlarge', 'g6.48xlarge',
  
  // G6e series (NVIDIA L40S GPUs)
  'g6e.xlarge', 'g6e.2xlarge', 'g6e.4xlarge', 'g6e.8xlarge', 'g6e.12xlarge', 'g6e.16xlarge', 'g6e.24xlarge', 'g6e.48xlarge',
  
  // Gr6 series (NVIDIA RTX 6000 Ada GPUs)
  'gr6.4xlarge', 'gr6.8xlarge'
];

// Define AWS regions with GPU instances
const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-southeast-1', 'ap-southeast-2',
  'ap-south-1',
  'sa-east-1'
];

/**
 * Get current spot prices for GPU instances
 * @param {string} region - AWS region (optional)
 * @param {string} instanceType - EC2 instance type (optional)
 * @returns {Promise<Array>} Spot prices
 */
const getCurrentSpotPrices = async (region, instanceType) => {
  try {
    // Generate correlation ID for tracking this operation
    const correlationId = uuidv4();
    
    // Use enhanced logging with correlation ID
    return logger.withCorrelationId(async () => {
      // Validate region if provided
      if (region && !AWS_REGIONS.includes(region)) {
        throw new BadRequestError(`Invalid region: ${region}`);
      }
      
      // Validate instance type if provided
      if (instanceType && !GPU_INSTANCE_TYPES.includes(instanceType)) {
        throw new BadRequestError(`Invalid instance type: ${instanceType}`);
      }
      
      // Set up regions to query
      const regionsToQuery = region ? [region] : AWS_REGIONS;
      
      // Set up instance types to query
      const instanceTypesToQuery = instanceType ? [instanceType] : GPU_INSTANCE_TYPES;
      
      // Get spot prices for each region
      const allPrices = [];
      const anomalyDetections = [];
      
      for (const currentRegion of regionsToQuery) {
        // Create a new EC2 client for the current region
        const regionClient = new EC2Client({
          region: currentRegion
        });
        
        const command = new DescribeSpotPriceHistoryCommand({
          InstanceTypes: instanceTypesToQuery,
          ProductDescriptions: ['Linux/UNIX'],
          StartTime: new Date(Date.now() - 1000 * 60 * 60) // Last hour
        });
        
        const response = await regionClient.send(command);
        
        // Process and store the spot prices
        if (response.SpotPriceHistory && response.SpotPriceHistory.length > 0) {
          // Group by instance type and availability zone to get the latest price
          const priceMap = {};
          
          response.SpotPriceHistory.forEach(price => {
            const key = `${price.InstanceType}-${price.AvailabilityZone}`;
            
            if (!priceMap[key] || new Date(price.Timestamp) > new Date(priceMap[key].Timestamp)) {
              priceMap[key] = price;
            }
          });
          
          // Convert map to array and format the data
          const regionPrices = Object.values(priceMap).map(price => ({
            region: currentRegion,
            availabilityZone: price.AvailabilityZone,
            instanceType: price.InstanceType,
            price: parseFloat(price.SpotPrice),
            timestamp: price.Timestamp.toISOString()
          }));
          
          allPrices.push(...regionPrices);
          
          // Store prices in DynamoDB and check for anomalies
          for (const price of regionPrices) {
            // Generate a unique ID for this price record
            const priceId = uuidv4();
            
            // Store in DynamoDB
            await dynamodb.putItem('spot-price-history', {
              id: priceId,
              region: price.region,
              availabilityZone: price.availabilityZone,
              instanceType: price.instanceType,
              price: price.price,
              timestamp: Math.floor(new Date(price.timestamp).getTime() / 1000)
            });
            
            // Get previous price for comparison (from 1 day ago)
            const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
            
            const previousPriceParams = {
              IndexName: 'InstanceTypeTimestampIndex',
              KeyConditionExpression: 'instanceType = :instanceType AND timestamp >= :startTimestamp',
              FilterExpression: 'region = :region AND availabilityZone = :availabilityZone',
              ExpressionAttributeValues: {
                ':instanceType': price.instanceType,
                ':startTimestamp': oneDayAgo,
                ':region': price.region,
                ':availabilityZone': price.availabilityZone
              },
              Limit: 1
            };
            
            const previousPrices = await dynamodb.queryItems('spot-price-history', previousPriceParams);
            const previousPrice = previousPrices.length > 0 ? previousPrices[0].price : price.price;
            
            // Publish spot price metrics and check for anomalies
            const metricsResult = await foldingMetrics.publishSpotPriceMetrics(
              price.instanceType,
              price.region,
              price.price,
              previousPrice
            );
            
            // If anomaly detected, add to list
            if (metricsResult.anomalyScore > 0.7) {
              anomalyDetections.push({
                instanceType: price.instanceType,
                region: price.region,
                availabilityZone: price.availabilityZone,
                currentPrice: price.price,
                previousPrice,
                priceChangePercent: metricsResult.priceChangePercent,
                anomalyScore: metricsResult.anomalyScore
              });
            }
          }
        }
      }
      
      // Log anomaly detections if any
      if (anomalyDetections.length > 0) {
        logger.warn('Spot price anomalies detected', {
          metadata: {
            anomalyCount: anomalyDetections.length,
            anomalies: anomalyDetections,
            correlationId
          }
        });
      }
      
      logger.info('Retrieved current spot prices', {
        metadata: {
          count: allPrices.length,
          region,
          instanceType,
          anomalyCount: anomalyDetections.length,
          correlationId
        }
      });
      
      return {
        prices: allPrices,
        anomalies: anomalyDetections,
        correlationId
      };
    }, correlationId);
  } catch (error) {
    logger.error('Error getting current spot prices', {
      metadata: {
        error: error.message,
        stack: error.stack,
        region,
        instanceType
      }
    });
    throw error;
  }
};

/**
 * Get spot price history
 * @param {string} instanceType - EC2 instance type
 * @param {string} region - AWS region (optional)
 * @param {number} days - Number of days of history (default: 7)
 * @returns {Promise<Array>} Spot price history
 */
const getSpotPriceHistory = async (instanceType, region, days = 7) => {
  try {
    // Validate instance type
    if (!GPU_INSTANCE_TYPES.includes(instanceType)) {
      throw new BadRequestError(`Invalid instance type: ${instanceType}`);
    }
    
    // Validate region if provided
    if (region && !AWS_REGIONS.includes(region)) {
      throw new BadRequestError(`Invalid region: ${region}`);
    }
    
    // Calculate timestamp for filtering
    const startTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    // Query parameters
    let params = {
      IndexName: 'InstanceTypeTimestampIndex',
      KeyConditionExpression: 'instanceType = :instanceType AND timestamp >= :startTimestamp',
      ExpressionAttributeValues: {
        ':instanceType': instanceType,
        ':startTimestamp': startTimestamp
      }
    };
    
    // Add region filter if provided
    if (region) {
      params.FilterExpression = 'region = :region';
      params.ExpressionAttributeValues[':region'] = region;
    }
    
    // Query DynamoDB
    const prices = await dynamodb.queryItems('spot-price-history', params);
    
    // If no prices found in DynamoDB, fetch from AWS
    if (prices.length === 0) {
      // Create a new EC2 client for the specified region or default
      const regionClient = new EC2Client({
        region: region || process.env.AWS_REGION || 'us-east-1'
      });
      
      const command = new DescribeSpotPriceHistoryCommand({
        InstanceTypes: [instanceType],
        ProductDescriptions: ['Linux/UNIX'],
        StartTime: new Date(startTimestamp * 1000)
      });
      
      const response = await regionClient.send(command);
      
      if (!response.SpotPriceHistory || response.SpotPriceHistory.length === 0) {
        return [];
      }
      
      // Process and store the spot prices
      const historyPrices = response.SpotPriceHistory.map(price => ({
        region: region || price.AvailabilityZone.slice(0, -1),
        availabilityZone: price.AvailabilityZone,
        instanceType: price.InstanceType,
        price: parseFloat(price.SpotPrice),
        timestamp: price.Timestamp.toISOString()
      }));
      
      // Store prices in DynamoDB
      for (const price of historyPrices) {
        await dynamodb.putItem('spot-price-history', {
          id: uuidv4(),
          region: price.region,
          availabilityZone: price.availabilityZone,
          instanceType: price.instanceType,
          price: price.price,
          timestamp: Math.floor(new Date(price.timestamp).getTime() / 1000)
        });
      }
      
      logger.info('Retrieved and stored spot price history from AWS', { 
        count: historyPrices.length, 
        instanceType, 
        region, 
        days 
      });
      
      return historyPrices;
    }
    
    // Format the data from DynamoDB
    const formattedPrices = prices.map(price => ({
      region: price.region,
      availabilityZone: price.availabilityZone,
      instanceType: price.instanceType,
      price: price.price,
      timestamp: new Date(price.timestamp * 1000).toISOString()
    }));
    
    logger.info('Retrieved spot price history from DynamoDB', { 
      count: formattedPrices.length, 
      instanceType, 
      region, 
      days 
    });
    
    return formattedPrices;
  } catch (error) {
    logger.error('Error getting spot price history', { error, instanceType, region, days });
    throw error;
  }
};

/**
 * Get supported GPU instance types
 * @returns {Array} List of supported GPU instance types
 */
const getSupportedInstanceTypes = () => {
  return GPU_INSTANCE_TYPES;
};

/**
 * Get supported AWS regions
 * @returns {Array} List of supported AWS regions
 */
const getSupportedRegions = () => {
  return AWS_REGIONS;
};

module.exports = {
  getCurrentSpotPrices,
  getSpotPriceHistory,
  getSupportedInstanceTypes,
  getSupportedRegions
};