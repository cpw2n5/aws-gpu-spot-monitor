/**
 * Mock implementation of the folding-metrics utility
 */

// Store metrics for inspection in tests
const metrics = {
  spotPrice: [],
  folding: [],
  spotInstance: []
};

// Reset metrics
const resetMetrics = () => {
  metrics.spotPrice = [];
  metrics.folding = [];
  metrics.spotInstance = [];
};

// Mock publishSpotPriceMetrics function
const publishSpotPriceMetrics = jest.fn().mockImplementation(
  (instanceType, region, currentPrice, previousPrice) => {
    // Calculate price change percentage
    const priceChangePercent = previousPrice > 0 
      ? ((currentPrice - previousPrice) / previousPrice) * 100 
      : 0;
    
    // Calculate anomaly score (simplified for testing)
    const anomalyScore = Math.abs(priceChangePercent) > 20 ? 0.8 : 0.2;
    
    const metric = {
      instanceType,
      region,
      currentPrice,
      previousPrice,
      priceChangePercent,
      anomalyScore,
      timestamp: new Date().toISOString()
    };
    
    metrics.spotPrice.push(metric);
    
    return Promise.resolve({
      priceChangePercent,
      anomalyScore
    });
  }
);

// Mock publishFoldingMetrics function
const publishFoldingMetrics = jest.fn().mockImplementation(
  (userId, instanceId, stats) => {
    const metric = {
      userId,
      instanceId,
      stats,
      timestamp: new Date().toISOString()
    };
    
    metrics.folding.push(metric);
    
    return Promise.resolve(true);
  }
);

// Mock publishSpotInstanceMetrics function
const publishSpotInstanceMetrics = jest.fn().mockImplementation(
  (instanceId, healthScore, hasInterruptionWarning, additionalMetrics = {}) => {
    const metric = {
      instanceId,
      healthScore,
      hasInterruptionWarning,
      additionalMetrics,
      timestamp: new Date().toISOString()
    };
    
    metrics.spotInstance.push(metric);
    
    return Promise.resolve(true);
  }
);

module.exports = {
  publishSpotPriceMetrics,
  publishFoldingMetrics,
  publishSpotInstanceMetrics,
  metrics,
  resetMetrics
};