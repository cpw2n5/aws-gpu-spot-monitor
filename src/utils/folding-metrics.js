const AWS = require('aws-sdk');
const logger = require('./logger');

// Initialize CloudWatch client
const cloudWatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Namespace for CloudWatch metrics
const NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'aws-gpu-spot-monitor';

/**
 * Publish Folding@Home progress metrics to CloudWatch
 * @param {string} userId - User ID
 * @param {string} instanceId - Instance ID
 * @param {object} foldingStats - Folding@Home statistics
 * @returns {Promise<object>} Result
 */
const publishFoldingMetrics = async (userId, instanceId, foldingStats) => {
  try {
    if (!foldingStats) {
      logger.warn('No Folding@Home stats provided for metrics', { userId, instanceId });
      return { success: false, message: 'No stats provided' };
    }

    // Extract metrics from folding stats
    const { score, wus, rank, active_clients } = foldingStats;
    
    // Calculate progress (if available)
    const progress = foldingStats.progress || 0;
    
    // Common dimensions for all metrics
    const dimensions = [
      {
        Name: 'UserId',
        Value: userId
      },
      {
        Name: 'InstanceId',
        Value: instanceId
      },
      {
        Name: 'Environment',
        Value: process.env.NODE_ENV || 'development'
      }
    ];
    
    // Prepare metric data
    const metricData = [
      // Folding score (total points)
      {
        MetricName: 'FoldingScore',
        Dimensions: dimensions,
        Value: score || 0,
        Unit: 'Count',
        Timestamp: new Date()
      },
      // Work units completed
      {
        MetricName: 'FoldingWUs',
        Dimensions: dimensions,
        Value: wus || 0,
        Unit: 'Count',
        Timestamp: new Date()
      },
      // Folding rank
      {
        MetricName: 'FoldingRank',
        Dimensions: dimensions,
        Value: rank || 0,
        Unit: 'None',
        Timestamp: new Date()
      },
      // Active clients
      {
        MetricName: 'FoldingActiveClients',
        Dimensions: dimensions,
        Value: active_clients || 0,
        Unit: 'Count',
        Timestamp: new Date()
      },
      // Current work unit progress
      {
        MetricName: 'FoldingProgress',
        Dimensions: dimensions,
        Value: progress,
        Unit: 'Percent',
        Timestamp: new Date()
      }
    ];
    
    // Publish metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: NAMESPACE,
      MetricData: metricData
    }).promise();
    
    logger.info('Published Folding@Home metrics to CloudWatch', {
      metadata: {
        userId,
        instanceId,
        metrics: {
          score,
          wus,
          rank,
          active_clients,
          progress
        }
      }
    });
    
    return {
      success: true,
      message: 'Folding@Home metrics published successfully'
    };
  } catch (error) {
    logger.error('Failed to publish Folding@Home metrics', {
      metadata: {
        error: error.message,
        userId,
        instanceId
      }
    });
    
    return {
      success: false,
      message: `Failed to publish metrics: ${error.message}`
    };
  }
};

/**
 * Publish spot instance health metrics to CloudWatch
 * @param {string} instanceId - Instance ID
 * @param {number} healthScore - Health score (0-100)
 * @param {boolean} interruptionWarning - Whether an interruption warning was detected
 * @param {object} additionalMetrics - Additional metrics to publish
 * @returns {Promise<object>} Result
 */
const publishSpotInstanceMetrics = async (instanceId, healthScore, interruptionWarning = false, additionalMetrics = {}) => {
  try {
    // Common dimensions for all metrics
    const dimensions = [
      {
        Name: 'InstanceId',
        Value: instanceId
      },
      {
        Name: 'Environment',
        Value: process.env.NODE_ENV || 'development'
      }
    ];
    
    // Prepare metric data
    const metricData = [
      // Spot instance health score
      {
        MetricName: 'SpotInstanceHealth',
        Dimensions: dimensions,
        Value: healthScore,
        Unit: 'Percent',
        Timestamp: new Date()
      },
      // Spot interruption warning
      {
        MetricName: 'SpotInterruptionWarnings',
        Dimensions: dimensions,
        Value: interruptionWarning ? 1 : 0,
        Unit: 'Count',
        Timestamp: new Date()
      }
    ];
    
    // Add additional metrics if provided
    if (additionalMetrics) {
      for (const [metricName, value] of Object.entries(additionalMetrics)) {
        if (typeof value === 'number') {
          metricData.push({
            MetricName: metricName,
            Dimensions: dimensions,
            Value: value,
            Unit: 'None', // Default unit
            Timestamp: new Date()
          });
        }
      }
    }
    
    // Publish metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: NAMESPACE,
      MetricData: metricData
    }).promise();
    
    logger.info('Published spot instance metrics to CloudWatch', {
      metadata: {
        instanceId,
        healthScore,
        interruptionWarning,
        additionalMetrics
      }
    });
    
    return {
      success: true,
      message: 'Spot instance metrics published successfully'
    };
  } catch (error) {
    logger.error('Failed to publish spot instance metrics', {
      metadata: {
        error: error.message,
        instanceId
      }
    });
    
    return {
      success: false,
      message: `Failed to publish metrics: ${error.message}`
    };
  }
};

/**
 * Publish spot price metrics to CloudWatch with anomaly detection
 * @param {string} instanceType - EC2 instance type
 * @param {string} region - AWS region
 * @param {number} currentPrice - Current spot price
 * @param {number} previousPrice - Previous spot price
 * @returns {Promise<object>} Result with anomaly score
 */
const publishSpotPriceMetrics = async (instanceType, region, currentPrice, previousPrice) => {
  try {
    // Calculate price change percentage
    const priceChangePercent = previousPrice > 0 ? 
      ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
    
    // Calculate anomaly score (simple implementation)
    // Higher score means more anomalous
    // 0.0 - 1.0 scale where > 0.7 is considered anomalous
    let anomalyScore = 0;
    
    // Sudden price increases are more concerning
    if (priceChangePercent > 50) {
      anomalyScore = 0.9; // Severe anomaly
    } else if (priceChangePercent > 30) {
      anomalyScore = 0.8; // High anomaly
    } else if (priceChangePercent > 20) {
      anomalyScore = 0.7; // Moderate anomaly
    } else if (priceChangePercent > 10) {
      anomalyScore = 0.5; // Mild anomaly
    } else if (priceChangePercent < -20) {
      anomalyScore = 0.3; // Interesting but not concerning
    }
    
    // Common dimensions for all metrics
    const dimensions = [
      {
        Name: 'InstanceType',
        Value: instanceType
      },
      {
        Name: 'Region',
        Value: region
      },
      {
        Name: 'Environment',
        Value: process.env.NODE_ENV || 'development'
      }
    ];
    
    // Format instance type for metric name (remove dots and special chars)
    const formattedInstanceType = instanceType.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    // Prepare metric data
    const metricData = [
      // Current spot price
      {
        MetricName: `SpotPrice${formattedInstanceType}`,
        Dimensions: dimensions,
        Value: currentPrice,
        Unit: 'None',
        Timestamp: new Date()
      },
      // Price change percentage
      {
        MetricName: 'SpotPriceChangePercent',
        Dimensions: dimensions,
        Value: priceChangePercent,
        Unit: 'Percent',
        Timestamp: new Date()
      },
      // Anomaly score
      {
        MetricName: 'SpotPriceAnomalyScore',
        Dimensions: dimensions,
        Value: anomalyScore,
        Unit: 'None',
        Timestamp: new Date()
      }
    ];
    
    // Publish metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: NAMESPACE,
      MetricData: metricData
    }).promise();
    
    logger.info('Published spot price metrics to CloudWatch', {
      metadata: {
        instanceType,
        region,
        currentPrice,
        previousPrice,
        priceChangePercent,
        anomalyScore
      }
    });
    
    return {
      success: true,
      message: 'Spot price metrics published successfully',
      anomalyScore,
      priceChangePercent
    };
  } catch (error) {
    logger.error('Failed to publish spot price metrics', {
      metadata: {
        error: error.message,
        instanceType,
        region
      }
    });
    
    return {
      success: false,
      message: `Failed to publish metrics: ${error.message}`,
      anomalyScore: 0
    };
  }
};

/**
 * Publish GPU performance metrics for Folding@Home workloads
 * @param {string} instanceId - Instance ID
 * @param {string} instanceType - EC2 instance type
 * @param {number} foldingPoints - Folding@Home points earned
 * @param {number} foldingProgress - Folding@Home work unit progress (0-100)
 * @param {number} spotPrice - Current spot price for the instance
 * @returns {Promise<object>} Result with performance metrics
 */
const publishGpuPerformanceMetrics = async (instanceId, instanceType, foldingPoints, foldingProgress, spotPrice) => {
  try {
    // Extract GPU family from instance type
    const instanceFamily = instanceType.split('.')[0];
    const instanceSize = instanceType.split('.')[1];
    
    // Define GPU families and their characteristics
    const gpuFamilies = {
      'p2': { gpuModel: 'NVIDIA K80', architecture: 'Kepler' },
      'p3': { gpuModel: 'NVIDIA V100', architecture: 'Volta' },
      'p4d': { gpuModel: 'NVIDIA A100', architecture: 'Ampere' },
      'p4de': { gpuModel: 'NVIDIA A100 80GB', architecture: 'Ampere' },
      'p5': { gpuModel: 'NVIDIA H100', architecture: 'Hopper' },
      'g3': { gpuModel: 'NVIDIA M60', architecture: 'Maxwell' },
      'g3s': { gpuModel: 'NVIDIA M60', architecture: 'Maxwell' },
      'g4dn': { gpuModel: 'NVIDIA T4', architecture: 'Turing' },
      'g5': { gpuModel: 'NVIDIA A10G', architecture: 'Ampere' },
      'g6': { gpuModel: 'NVIDIA L4', architecture: 'Ada Lovelace' },
      'g6e': { gpuModel: 'NVIDIA L40S', architecture: 'Ada Lovelace' },
      'gr6': { gpuModel: 'NVIDIA RTX 6000 Ada', architecture: 'Ada Lovelace' }
    };
    
    // Get GPU details
    const gpuDetails = gpuFamilies[instanceFamily] || {
      gpuModel: 'Unknown',
      architecture: 'Unknown'
    };
    
    // Calculate performance metrics
    // Points per dollar (higher is better)
    const pointsPerDollar = spotPrice > 0 ? foldingPoints / spotPrice : 0;
    
    // Estimated completion time based on progress (simplified)
    // This is a rough estimate assuming linear progress
    const estimatedTimeRemaining = foldingProgress > 0 ?
      (100 - foldingProgress) * (Date.now() / foldingProgress) / 3600000 : 0; // in hours
    
    // Common dimensions for all metrics
    const dimensions = [
      {
        Name: 'InstanceId',
        Value: instanceId
      },
      {
        Name: 'InstanceType',
        Value: instanceType
      },
      {
        Name: 'GPUModel',
        Value: gpuDetails.gpuModel
      },
      {
        Name: 'GPUArchitecture',
        Value: gpuDetails.architecture
      },
      {
        Name: 'Environment',
        Value: process.env.NODE_ENV || 'development'
      }
    ];
    
    // Prepare metric data
    const metricData = [
      // Points per dollar (efficiency metric)
      {
        MetricName: 'FoldingPointsPerDollar',
        Dimensions: dimensions,
        Value: pointsPerDollar,
        Unit: 'None',
        Timestamp: new Date()
      },
      // Estimated time remaining
      {
        MetricName: 'EstimatedTimeRemaining',
        Dimensions: dimensions,
        Value: estimatedTimeRemaining,
        Unit: 'Hours',
        Timestamp: new Date()
      },
      // GPU-specific folding performance
      {
        MetricName: 'GPUFoldingPerformance',
        Dimensions: dimensions,
        Value: foldingPoints,
        Unit: 'Count',
        Timestamp: new Date()
      }
    ];
    
    // Publish metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: NAMESPACE,
      MetricData: metricData
    }).promise();
    
    logger.info('Published GPU performance metrics to CloudWatch', {
      metadata: {
        instanceId,
        instanceType,
        gpuModel: gpuDetails.gpuModel,
        architecture: gpuDetails.architecture,
        pointsPerDollar,
        estimatedTimeRemaining
      }
    });
    
    return {
      success: true,
      message: 'GPU performance metrics published successfully',
      gpuModel: gpuDetails.gpuModel,
      architecture: gpuDetails.architecture,
      pointsPerDollar,
      estimatedTimeRemaining
    };
  } catch (error) {
    logger.error('Failed to publish GPU performance metrics', {
      metadata: {
        error: error.message,
        instanceId,
        instanceType
      }
    });
    
    return {
      success: false,
      message: `Failed to publish GPU metrics: ${error.message}`
    };
  }
};

module.exports = {
  publishFoldingMetrics,
  publishSpotInstanceMetrics,
  publishSpotPriceMetrics,
  publishGpuPerformanceMetrics
};