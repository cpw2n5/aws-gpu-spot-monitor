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
const logger = require('../utils/logger');
const dynamodb = require('../utils/dynamodb');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const spotPriceService = require('./spotPrice.service');

// Initialize the EC2 client
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Request a new spot instance
 * @param {string} userId - User ID
 * @param {string} instanceType - EC2 instance type
 * @param {string} region - AWS region
 * @param {number} maxPrice - Maximum price willing to pay per hour
 * @param {string} keyName - EC2 key pair name (optional)
 * @param {string} securityGroupId - Security group ID (optional)
 * @param {string} subnetId - Subnet ID (optional)
 * @param {object} foldingConfig - Folding@Home configuration (optional)
 * @returns {Promise<object>} Spot instance request details
 */
const requestSpotInstance = async (
  userId, 
  instanceType, 
  region, 
  maxPrice, 
  keyName = null, 
  securityGroupId = null, 
  subnetId = null,
  foldingConfig = null
) => {
  try {
    // Validate instance type
    const supportedInstanceTypes = spotPriceService.getSupportedInstanceTypes();
    if (!supportedInstanceTypes.includes(instanceType)) {
      throw new BadRequestError(`Invalid instance type: ${instanceType}`);
    }
    
    // Validate region
    const supportedRegions = spotPriceService.getSupportedRegions();
    if (!supportedRegions.includes(region)) {
      throw new BadRequestError(`Invalid region: ${region}`);
    }
    
    // Create a new EC2 client for the specified region
    const regionClient = new EC2Client({ region });
    
    // Prepare user data script for Folding@Home if config is provided
    let userData = '';
    if (foldingConfig) {
      userData = Buffer.from(`#!/bin/bash
# Install Docker
apt-get update
apt-get install -y docker.io
systemctl start docker
systemctl enable docker

# Run Folding@Home container
docker run -d \\
  --name folding \\
  -p 7396:7396 \\
  -e USER=${foldingConfig.user || 'anonymous'} \\
  -e TEAM=${foldingConfig.team || '0'} \\
  -e PASSKEY=${foldingConfig.passkey || ''} \\
  -e POWER=${foldingConfig.power || 'full'} \\
  -e GPU=true \\
  johnktims/folding-at-home
`).toString('base64');
    }
    
    // Prepare launch specification
    const launchSpecification = {
      ImageId: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 AMI (adjust as needed)
      InstanceType: instanceType,
      KeyName: keyName,
      SecurityGroupIds: securityGroupId ? [securityGroupId] : undefined,
      SubnetId: subnetId,
      UserData: userData || undefined
    };
    
    // Remove undefined properties
    Object.keys(launchSpecification).forEach(key => {
      if (launchSpecification[key] === undefined) {
        delete launchSpecification[key];
      }
    });
    
    // Request spot instance
    const command = new RequestSpotInstancesCommand({
      InstanceCount: 1,
      SpotPrice: maxPrice.toString(),
      Type: 'one-time',
      LaunchSpecification: launchSpecification
    });
    
    const response = await regionClient.send(command);
    
    if (!response.SpotInstanceRequests || response.SpotInstanceRequests.length === 0) {
      throw new Error('Failed to create spot instance request');
    }
    
    const spotRequest = response.SpotInstanceRequests[0];
    const spotRequestId = spotRequest.SpotInstanceRequestId;
    
    // Add tags to the spot request
    const tagCommand = new CreateTagsCommand({
      Resources: [spotRequestId],
      Tags: [
        {
          Key: 'Name',
          Value: `GPU-Spot-${userId.substring(0, 8)}`
        },
        {
          Key: 'UserId',
          Value: userId
        },
        {
          Key: 'ManagedBy',
          Value: 'aws-gpu-spot-monitor'
        }
      ]
    });
    
    await regionClient.send(tagCommand);
    
    // Store spot request in DynamoDB
    const instanceId = uuidv4();
    const instance = {
      id: instanceId,
      userId,
      spotRequestId,
      region,
      instanceType,
      maxPrice: parseFloat(maxPrice),
      status: spotRequest.State,
      statusCode: spotRequest.Status.Code,
      statusMessage: spotRequest.Status.Message,
      ec2InstanceId: null,
      publicDnsName: null,
      publicIpAddress: null,
      foldingConfig: foldingConfig ? JSON.stringify(foldingConfig) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamodb.putItem('instances', instance);
    
    logger.info('Spot instance requested', { instanceId, spotRequestId, userId, region, instanceType });
    
    return {
      instanceId,
      spotRequestId,
      region,
      instanceType,
      maxPrice: parseFloat(maxPrice),
      status: spotRequest.State,
      statusCode: spotRequest.Status.Code,
      statusMessage: spotRequest.Status.Message,
      foldingConfig: foldingConfig
    };
  } catch (error) {
    logger.error('Error requesting spot instance', { error, userId, instanceType, region });
    throw error;
  }
};

/**
 * Get instance details
 * @param {string} instanceId - Instance ID
 * @returns {Promise<object>} Instance details
 */
const getInstance = async (instanceId) => {
  try {
    const instance = await dynamodb.getItem('instances', { id: instanceId });
    
    if (!instance) {
      throw new NotFoundError(`Instance not found: ${instanceId}`);
    }
    
    // Parse folding config if exists
    if (instance.foldingConfig) {
      instance.foldingConfig = JSON.parse(instance.foldingConfig);
    }
    
    logger.info('Retrieved instance details', { instanceId });
    
    return instance;
  } catch (error) {
    logger.error('Error getting instance details', { error, instanceId });
    throw error;
  }
};

/**
 * List instances for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of instances
 */
const listInstances = async (userId) => {
  try {
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const instances = await dynamodb.queryItems('instances', params);
    
    // Parse folding config if exists
    instances.forEach(instance => {
      if (instance.foldingConfig) {
        instance.foldingConfig = JSON.parse(instance.foldingConfig);
      }
    });
    
    logger.info('Listed instances for user', { userId, count: instances.length });
    
    return instances;
  } catch (error) {
    logger.error('Error listing instances', { error, userId });
    throw error;
  }
};

/**
 * Update instance status
 * @param {string} instanceId - Instance ID
 * @returns {Promise<object>} Updated instance details
 */
const updateInstanceStatus = async (instanceId) => {
  try {
    const instance = await dynamodb.getItem('instances', { id: instanceId });
    
    if (!instance) {
      throw new NotFoundError(`Instance not found: ${instanceId}`);
    }
    
    // Create a new EC2 client for the instance's region
    const regionClient = new EC2Client({ region: instance.region });
    
    // Check spot request status
    const spotCommand = new DescribeSpotInstanceRequestsCommand({
      SpotInstanceRequestIds: [instance.spotRequestId]
    });
    
    const spotResponse = await regionClient.send(spotCommand);
    
    if (!spotResponse.SpotInstanceRequests || spotResponse.SpotInstanceRequests.length === 0) {
      throw new NotFoundError(`Spot request not found: ${instance.spotRequestId}`);
    }
    
    const spotRequest = spotResponse.SpotInstanceRequests[0];
    const status = spotRequest.State;
    const statusCode = spotRequest.Status.Code;
    const statusMessage = spotRequest.Status.Message;
    const ec2InstanceId = spotRequest.InstanceId;
    
    // Update instance with spot request status
    let updateExpression = 'SET status = :status, statusCode = :statusCode, statusMessage = :statusMessage, updatedAt = :updatedAt';
    let expressionAttributeValues = {
      ':status': status,
      ':statusCode': statusCode,
      ':statusMessage': statusMessage,
      ':updatedAt': new Date().toISOString()
    };
    
    // If instance is active and we have an EC2 instance ID
    if (status === 'active' && ec2InstanceId) {
      // Update EC2 instance ID if it's new
      if (instance.ec2InstanceId !== ec2InstanceId) {
        updateExpression += ', ec2InstanceId = :ec2InstanceId';
        expressionAttributeValues[':ec2InstanceId'] = ec2InstanceId;
      }
      
      // Get EC2 instance details
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [ec2InstanceId]
      });
      
      const instanceResponse = await regionClient.send(instanceCommand);
      
      if (instanceResponse.Reservations && 
          instanceResponse.Reservations.length > 0 && 
          instanceResponse.Reservations[0].Instances && 
          instanceResponse.Reservations[0].Instances.length > 0) {
        
        const ec2Instance = instanceResponse.Reservations[0].Instances[0];
        const publicDnsName = ec2Instance.PublicDnsName;
        const publicIpAddress = ec2Instance.PublicIpAddress;
        
        // Update DNS and IP if available
        if (publicDnsName) {
          updateExpression += ', publicDnsName = :publicDnsName';
          expressionAttributeValues[':publicDnsName'] = publicDnsName;
        }
        
        if (publicIpAddress) {
          updateExpression += ', publicIpAddress = :publicIpAddress';
          expressionAttributeValues[':publicIpAddress'] = publicIpAddress;
        }
      }
    }
    
    // Update instance in DynamoDB
    const updatedInstance = await dynamodb.updateItem(
      'instances',
      { id: instanceId },
      updateExpression,
      expressionAttributeValues
    );
    
    // Parse folding config if exists
    if (updatedInstance.foldingConfig) {
      updatedInstance.foldingConfig = JSON.parse(updatedInstance.foldingConfig);
    }
    
    logger.info('Updated instance status', { 
      instanceId, 
      status, 
      statusCode, 
      ec2InstanceId 
    });
    
    return updatedInstance;
  } catch (error) {
    logger.error('Error updating instance status', { error, instanceId });
    throw error;
  }
};

/**
 * Terminate an instance
 * @param {string} instanceId - Instance ID
 * @returns {Promise<object>} Termination result
 */
const terminateInstance = async (instanceId) => {
  try {
    const instance = await dynamodb.getItem('instances', { id: instanceId });
    
    if (!instance) {
      throw new NotFoundError(`Instance not found: ${instanceId}`);
    }
    
    // Create a new EC2 client for the instance's region
    const regionClient = new EC2Client({ region: instance.region });
    
    // Cancel spot request if it exists
    if (instance.spotRequestId) {
      const cancelCommand = new CancelSpotInstanceRequestsCommand({
        SpotInstanceRequestIds: [instance.spotRequestId]
      });
      
      await regionClient.send(cancelCommand);
      
      logger.info('Cancelled spot request', { 
        instanceId, 
        spotRequestId: instance.spotRequestId 
      });
    }
    
    // Terminate EC2 instance if it exists
    if (instance.ec2InstanceId) {
      const terminateCommand = new TerminateInstancesCommand({
        InstanceIds: [instance.ec2InstanceId]
      });
      
      await regionClient.send(terminateCommand);
      
      logger.info('Terminated EC2 instance', { 
        instanceId, 
        ec2InstanceId: instance.ec2InstanceId 
      });
    }
    
    // Update instance status in DynamoDB
    const updatedInstance = await dynamodb.updateItem(
      'instances',
      { id: instanceId },
      'SET status = :status, statusCode = :statusCode, statusMessage = :statusMessage, updatedAt = :updatedAt',
      {
        ':status': 'cancelled',
        ':statusCode': 'terminated-by-user',
        ':statusMessage': 'Instance terminated by user',
        ':updatedAt': new Date().toISOString()
      }
    );
    
    // Parse folding config if exists
    if (updatedInstance.foldingConfig) {
      updatedInstance.foldingConfig = JSON.parse(updatedInstance.foldingConfig);
    }
    
    return {
      success: true,
      message: 'Instance terminated successfully',
      instance: updatedInstance
    };
  } catch (error) {
    logger.error('Error terminating instance', { error, instanceId });
    throw error;
  }
};

/**
 * Get recommended instance types for Folding@Home workloads
 * @param {string} region - AWS region (optional)
 * @param {number} maxPrice - Maximum price willing to pay per hour (optional)
 * @param {number} limit - Maximum number of recommendations to return (optional, default: 5)
 * @returns {Promise<Array>} Sorted list of recommended instance types
 */
const getRecommendedInstanceTypes = async (region = null, maxPrice = null, limit = 5) => {
  try {
    // Get current spot prices for all GPU instance types
    const spotPricesResponse = await spotPriceService.getCurrentSpotPrices(region);
    const spotPrices = spotPricesResponse.prices;
    
    // Define performance weights for different GPU families (based on Folding@Home performance)
    // Higher values indicate better performance for Folding@Home workloads
    const performanceWeights = {
      // Newer GPUs with better performance/price ratio get higher weights
      'g6': 9.5,    // NVIDIA L4 - excellent performance/price
      'g5': 9.0,    // NVIDIA A10G - very good performance
      'g6e': 8.5,   // NVIDIA L40S - high performance but higher price
      'gr6': 8.0,   // NVIDIA RTX 6000 Ada - good for specific workloads
      'p3': 7.5,    // NVIDIA V100 - still good performance
      'p4d': 7.0,   // NVIDIA A100 - high performance but expensive
      'p4de': 7.0,  // NVIDIA A100 80GB - high performance but expensive
      'p5': 6.5,    // NVIDIA H100 - highest performance but most expensive
      'g4dn': 6.0,  // NVIDIA T4 - older but still decent
      'g3': 4.0,    // NVIDIA M60 - older architecture
      'p2': 3.0     // NVIDIA K80 - oldest architecture
    };
    
    // Calculate score for each instance type based on price and performance
    const instanceScores = [];
    
    for (const price of spotPrices) {
      // Skip if price is above max price (if specified)
      if (maxPrice !== null && price.price > maxPrice) {
        continue;
      }
      
      // Determine GPU family from instance type
      const instanceFamily = price.instanceType.split('.')[0];
      const instanceSize = price.instanceType.split('.')[1];
      
      // Get performance weight for this GPU family
      const performanceWeight = performanceWeights[instanceFamily] || 5.0;
      
      // Calculate size factor (smaller instances often have better performance/price ratio)
      let sizeFactor = 1.0;
      if (instanceSize.includes('xlarge')) {
        const xlargeFactor = parseInt(instanceSize.replace('xlarge', '')) || 1;
        // Smaller instances get a slight boost for cost-effectiveness
        sizeFactor = Math.max(0.8, 1.0 - (xlargeFactor * 0.02));
      }
      
      // Calculate score (higher is better)
      // Formula: (performance weight * size factor) / price
      const score = (performanceWeight * sizeFactor) / price.price;
      
      instanceScores.push({
        instanceType: price.instanceType,
        region: price.region,
        availabilityZone: price.availabilityZone,
        price: price.price,
        performanceWeight,
        score,
        gpuFamily: instanceFamily
      });
    }
    
    // Sort by score (descending)
    instanceScores.sort((a, b) => b.score - a.score);
    
    // Get top recommendations
    const recommendations = instanceScores.slice(0, limit);
    
    logger.info('Generated instance type recommendations', {
      count: recommendations.length,
      region,
      maxPrice
    });
    
    return recommendations;
  } catch (error) {
    logger.error('Error getting recommended instance types', { error, region, maxPrice });
    throw error;
  }
};

module.exports = {
  requestSpotInstance,
  getInstance,
  listInstances,
  updateInstanceStatus,
  terminateInstance,
  getRecommendedInstanceTypes
};