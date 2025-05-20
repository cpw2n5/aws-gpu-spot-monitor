const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const dynamodb = require('../utils/dynamodb');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const instanceService = require('./instance.service');
const foldingMetrics = require('../utils/folding-metrics');

/**
 * Create or update Folding@Home configuration
 * @param {string} userId - User ID
 * @param {object} config - Folding@Home configuration
 * @returns {Promise<object>} Saved configuration
 */
const saveConfiguration = async (userId, config) => {
  try {
    // Validate configuration
    if (!config) {
      throw new BadRequestError('Configuration is required');
    }
    
    // Check if user already has a configuration
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const existingConfigs = await dynamodb.queryItems('folding-config', params);
    
    let configId;
    let createdAt;
    
    if (existingConfigs.length > 0) {
      // Update existing configuration
      configId = existingConfigs[0].id;
      createdAt = existingConfigs[0].createdAt;
    } else {
      // Create new configuration
      configId = uuidv4();
      createdAt = new Date().toISOString();
    }
    
    // Prepare configuration object
    const foldingConfig = {
      id: configId,
      userId,
      user: config.user || 'anonymous',
      team: config.team || '0',
      passkey: config.passkey || '',
      power: config.power || 'full',
      createdAt,
      updatedAt: new Date().toISOString()
    };
    
    // Save to DynamoDB
    await dynamodb.putItem('folding-config', foldingConfig);
    
    logger.info('Saved Folding@Home configuration', { userId, configId });
    
    return foldingConfig;
  } catch (error) {
    logger.error('Error saving Folding@Home configuration', { error, userId });
    throw error;
  }
};

/**
 * Get Folding@Home configuration for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} User's configuration
 */
const getConfiguration = async (userId) => {
  try {
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const configs = await dynamodb.queryItems('folding-config', params);
    
    if (configs.length === 0) {
      // Return default configuration if none exists
      return {
        user: 'anonymous',
        team: '0',
        passkey: '',
        power: 'full'
      };
    }
    
    // Return the first configuration (users should only have one)
    return configs[0];
  } catch (error) {
    logger.error('Error getting Folding@Home configuration', { error, userId });
    throw error;
  }
};

/**
 * Delete Folding@Home configuration for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result
 */
const deleteConfiguration = async (userId) => {
  try {
    const params = {
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const configs = await dynamodb.queryItems('folding-config', params);
    
    if (configs.length === 0) {
      throw new NotFoundError('Configuration not found');
    }
    
    // Delete the configuration
    await dynamodb.deleteItem('folding-config', { id: configs[0].id });
    
    logger.info('Deleted Folding@Home configuration', { userId });
    
    return {
      success: true,
      message: 'Configuration deleted successfully'
    };
  } catch (error) {
    logger.error('Error deleting Folding@Home configuration', { error, userId });
    throw error;
  }
};

/**
 * Apply Folding@Home configuration to an instance
 * @param {string} userId - User ID
 * @param {string} instanceId - Instance ID
 * @returns {Promise<object>} Result
 */
const applyConfigurationToInstance = async (userId, instanceId) => {
  try {
    // Get the instance
    const instance = await instanceService.getInstance(instanceId);
    
    // Verify that the instance belongs to the user
    if (instance.userId !== userId) {
      throw new BadRequestError('You do not have permission to update this instance');
    }
    
    // Get the user's Folding@Home configuration
    const config = await getConfiguration(userId);
    
    // Update the instance with the configuration
    // This would typically involve SSH into the instance and updating the configuration
    // For this implementation, we'll just update the instance record
    
    // Parse existing folding config if it exists
    let foldingConfig = instance.foldingConfig ? 
      (typeof instance.foldingConfig === 'string' ? 
        JSON.parse(instance.foldingConfig) : instance.foldingConfig) : 
      {};
    
    // Update with new configuration
    foldingConfig = {
      ...foldingConfig,
      user: config.user,
      team: config.team,
      passkey: config.passkey,
      power: config.power
    };
    
    // Update instance in DynamoDB
    const updatedInstance = await dynamodb.updateItem(
      'instances',
      { id: instanceId },
      'SET foldingConfig = :foldingConfig, updatedAt = :updatedAt',
      {
        ':foldingConfig': JSON.stringify(foldingConfig),
        ':updatedAt': new Date().toISOString()
      }
    );
    
    logger.info('Applied Folding@Home configuration to instance', { 
      userId, 
      instanceId 
    });
    
    return {
      success: true,
      message: 'Configuration applied successfully',
      instance: {
        ...updatedInstance,
        foldingConfig
      }
    };
  } catch (error) {
    logger.error('Error applying Folding@Home configuration', { error, userId, instanceId });
    throw error;
  }
};

/**
 * Get Folding@Home stats for a user
 * @param {string} user - Folding@Home username
 * @param {string} team - Folding@Home team ID
 * @returns {Promise<object>} Folding@Home stats
 */
const getStats = async (user, team) => {
  try {
    // Default values
    user = user || 'anonymous';
    team = team || '0';
    
    // Fetch stats from Folding@Home API
    // Note: This is a mock implementation as the actual API endpoints may vary
    const response = await axios.get(`https://stats.foldingathome.org/api/donor/${user}`);
    
    if (!response.data) {
      throw new Error('Failed to fetch Folding@Home stats');
    }
    
    // Process and return the stats
    const stats = {
      user,
      team,
      score: response.data.credit || 0,
      wus: response.data.wus || 0,
      rank: response.data.rank || 0,
      active_clients: response.data.active_clients || 0,
      last_updated: new Date().toISOString()
    };
    
    logger.info('Retrieved Folding@Home stats', { user, team });
    
    return stats;
  } catch (error) {
    logger.error('Error getting Folding@Home stats', { error, user, team });
    
    // Return default stats if API call fails
    return {
      user,
      team,
      score: 0,
      wus: 0,
      rank: 0,
      active_clients: 0,
      last_updated: new Date().toISOString(),
      error: 'Failed to fetch stats from Folding@Home API'
    };
  }
};

/**
 * Get Folding@Home status for an instance
 * @param {string} userId - User ID
 * @param {string} instanceId - Instance ID
 * @returns {Promise<object>} Folding@Home status
 */
const getInstanceStatus = async (userId, instanceId) => {
  try {
    // Generate correlation ID for tracking this operation
    const correlationId = uuidv4();
    
    // Use enhanced logging with correlation ID
    return logger.withCorrelationId(async () => {
      // Get the instance
      const instance = await instanceService.getInstance(instanceId);
      
      // Verify that the instance belongs to the user
      if (instance.userId !== userId) {
        throw new BadRequestError('You do not have permission to access this instance');
      }
      
      // Check if instance has Folding@Home configuration
      if (!instance.foldingConfig) {
        logger.info('Folding@Home not configured for instance', {
          metadata: { userId, instanceId, correlationId }
        });
        
        return {
          instanceId,
          status: 'not_configured',
          message: 'Folding@Home is not configured for this instance',
          correlationId
        };
      }
      
      // Parse folding config if it's a string
      const foldingConfig = typeof instance.foldingConfig === 'string' ?
        JSON.parse(instance.foldingConfig) : instance.foldingConfig;
      
      // In a real implementation, we would SSH into the instance and check the status
      // For this implementation, we'll return a mock status based on the instance status
      
      let foldingStatus;
      let foldingMessage;
      let foldingProgress = 0;
      
      if (instance.status === 'active' && instance.ec2InstanceId) {
        foldingStatus = 'running';
        foldingMessage = 'Folding@Home is running';
        
        // Simulate progress for active instances (0-100%)
        foldingProgress = Math.floor(Math.random() * 100);
      } else if (instance.status === 'open') {
        foldingStatus = 'pending';
        foldingMessage = 'Waiting for instance to start';
      } else {
        foldingStatus = 'stopped';
        foldingMessage = `Instance is ${instance.status}`;
      }
      
      // Get user stats if available
      let stats = null;
      if (foldingConfig.user && foldingConfig.user !== 'anonymous') {
        stats = await getStats(foldingConfig.user, foldingConfig.team);
        
        // Publish Folding@Home metrics to CloudWatch if stats are available
        if (stats) {
          // Add progress to stats
          stats.progress = foldingProgress;
          
          // Publish metrics
          await foldingMetrics.publishFoldingMetrics(userId, instanceId, stats);
          
          // Get instance details for GPU performance metrics
          const instanceDetails = await instanceService.getInstance(instanceId);
          
          // If we have instance type and spot price information, publish GPU performance metrics
          if (instanceDetails && instanceDetails.instanceType) {
            // Get current spot price for this instance type and region
            let spotPrice = 0;
            
            try {
              // Try to get the current spot price from the spot price service
              const spotPricesResponse = await require('./spotPrice.service').getCurrentSpotPrices(
                instanceDetails.region,
                instanceDetails.instanceType
              );
              
              if (spotPricesResponse && spotPricesResponse.prices && spotPricesResponse.prices.length > 0) {
                // Use the first price found (should be the most recent)
                spotPrice = spotPricesResponse.prices[0].price;
              }
            } catch (priceError) {
              logger.warn('Failed to get spot price for GPU metrics', {
                metadata: {
                  error: priceError.message,
                  instanceId,
                  instanceType: instanceDetails.instanceType
                }
              });
            }
            
            // Publish GPU-specific performance metrics
            await foldingMetrics.publishGpuPerformanceMetrics(
              instanceId,
              instanceDetails.instanceType,
              stats.score || 0,
              foldingProgress,
              spotPrice
            );
          }
        }
      }
      
      // Calculate instance health score (0-100%)
      // This is a simplified implementation - in a real system, this would be based on
      // actual instance metrics like CPU steal time, network errors, etc.
      const healthScore = instance.status === 'active' ?
        (100 - Math.floor(Math.random() * 30)) : 0;
      
      // Simulate spot interruption warning (rare event)
      const hasInterruptionWarning = Math.random() < 0.05; // 5% chance
      
      // Publish spot instance metrics
      if (instance.ec2InstanceId) {
        await foldingMetrics.publishSpotInstanceMetrics(
          instanceId,
          healthScore,
          hasInterruptionWarning,
          { foldingProgress }
        );
      }
      
      logger.info('Retrieved Folding@Home instance status', {
        metadata: {
          userId,
          instanceId,
          status: foldingStatus,
          healthScore,
          hasInterruptionWarning,
          correlationId
        }
      });
      
      return {
        instanceId,
        status: foldingStatus,
        message: foldingMessage,
        config: foldingConfig,
        stats,
        healthScore,
        hasInterruptionWarning,
        progress: foldingProgress,
        correlationId
      };
    }, correlationId);
  } catch (error) {
    logger.error('Error getting Folding@Home instance status', {
      metadata: {
        error: error.message,
        stack: error.stack,
        userId,
        instanceId
      }
    });
    throw error;
  }
};

/**
 * Get GPU performance data for comparison charts
 * @param {string} chartType - Type of chart (performancePerDollar, rawPerformance, availability)
 * @returns {Promise<Array>} Performance data for chart
 */
const getGpuPerformanceData = async (chartType) => {
  try {
    // In a real implementation, this would query DynamoDB for actual performance metrics
    // For now, we'll return sample data based on the chart type
    
    // Define GPU families to include in the chart
    const gpuFamilies = [
      { family: 'g6', name: 'g6 (L4)', color: '#8884d8' },
      { family: 'g5', name: 'g5 (A10G)', color: '#82ca9d' },
      { family: 'g6e', name: 'g6e (L40S)', color: '#ffc658' },
      { family: 'p3', name: 'p3 (V100)', color: '#ff8042' },
      { family: 'p4d', name: 'p4d (A100)', color: '#0088fe' },
      { family: 'p5', name: 'p5 (H100)', color: '#00C49F' }
    ];
    
    // Generate metrics based on chart type
    let chartData = [];
    
    if (chartType === 'performancePerDollar') {
      // Performance per dollar (higher is better)
      // These values represent relative cost efficiency for Folding@Home workloads
      chartData = [
        { name: 'g6 (L4)', value: 95, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 85, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 75, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 65, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 55, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 45, fill: '#00C49F' }
      ];
    } else if (chartType === 'rawPerformance') {
      // Raw performance (higher is better)
      // These values represent relative computational power for Folding@Home workloads
      chartData = [
        { name: 'g6 (L4)', value: 65, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 75, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 85, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 70, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 90, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 100, fill: '#00C49F' }
      ];
    } else { // availability
      // Spot instance availability (higher is better)
      // These values represent relative availability in the spot market
      chartData = [
        { name: 'g6 (L4)', value: 90, fill: '#8884d8' },
        { name: 'g5 (A10G)', value: 85, fill: '#82ca9d' },
        { name: 'g6e (L40S)', value: 70, fill: '#ffc658' },
        { name: 'p3 (V100)', value: 80, fill: '#ff8042' },
        { name: 'p4d (A100)', value: 60, fill: '#0088fe' },
        { name: 'p5 (H100)', value: 40, fill: '#00C49F' }
      ];
    }
    
    logger.info('Retrieved GPU performance data', { chartType });
    
    return chartData;
  } catch (error) {
    logger.error('Error getting GPU performance data', { error, chartType });
    return null;
  }
};

module.exports = {
  saveConfiguration,
  getConfiguration,
  deleteConfiguration,
  applyConfigurationToInstance,
  getStats,
  getInstanceStatus,
  getGpuPerformanceData
};