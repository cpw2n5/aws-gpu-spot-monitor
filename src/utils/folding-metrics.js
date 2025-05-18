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

module.exports = {
  publishFoldingMetrics,
  publishSpotInstanceMetrics,
  publishSpotPriceMetrics
};