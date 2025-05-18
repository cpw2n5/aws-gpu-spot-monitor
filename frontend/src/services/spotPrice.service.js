import api from './api';

/**
 * Service for handling spot price related operations
 */
const SpotPriceService = {
  /**
   * Get current spot prices for GPU instances
   * @param {string} region - Optional AWS region filter
   * @param {string} instanceType - Optional instance type filter
   * @returns {Promise} - Promise with current spot prices
   */
  getCurrentSpotPrices: async (region, instanceType) => {
    const params = {};
    if (region) params.region = region;
    if (instanceType) params.instanceType = instanceType;
    
    const response = await api.get('/spot-prices/current', { params });
    return response.data.data;
  },

  /**
   * Get spot price history
   * @param {string} instanceType - EC2 instance type
   * @param {string} region - Optional AWS region
   * @param {number} days - Number of days of history (default: 7)
   * @returns {Promise} - Promise with spot price history
   */
  getSpotPriceHistory: async (instanceType, region, days = 7) => {
    const params = { instanceType };
    if (region) params.region = region;
    if (days) params.days = days;
    
    const response = await api.get('/spot-prices/history', { params });
    return response.data.data;
  },

  /**
   * Get supported GPU instance types
   * @returns {Promise} - Promise with supported instance types
   */
  getSupportedInstanceTypes: async () => {
    const response = await api.get('/spot-prices/instance-types');
    return response.data.data.instanceTypes;
  },

  /**
   * Get supported AWS regions
   * @returns {Promise} - Promise with supported regions
   */
  getSupportedRegions: async () => {
    const response = await api.get('/spot-prices/regions');
    return response.data.data.regions;
  }
};

export default SpotPriceService;