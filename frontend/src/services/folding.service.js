import api from './api';

/**
 * Service for handling Folding@Home related operations
 */
const FoldingService = {
  /**
   * Get Folding@Home configuration for the current user
   * @returns {Promise} - Promise with folding configuration
   */
  getConfiguration: async () => {
    const response = await api.get('/folding/config');
    return response.data.data;
  },

  /**
   * Save Folding@Home configuration
   * @param {Object} config - Folding@Home configuration
   * @returns {Promise} - Promise with saved configuration
   */
  saveConfiguration: async (config) => {
    const response = await api.post('/folding/config', config);
    return response.data.data;
  },

  /**
   * Delete Folding@Home configuration
   * @returns {Promise} - Promise with deletion result
   */
  deleteConfiguration: async () => {
    const response = await api.delete('/folding/config');
    return response.data.data;
  },

  /**
   * Apply Folding@Home configuration to an instance
   * @param {string} instanceId - Instance ID
   * @returns {Promise} - Promise with application result
   */
  applyConfigurationToInstance: async (instanceId) => {
    const response = await api.post(`/folding/instances/${instanceId}/apply-config`);
    return response.data.data;
  },

  /**
   * Get Folding@Home stats
   * @param {string} user - Optional Folding@Home username
   * @param {string} team - Optional Folding@Home team ID
   * @returns {Promise} - Promise with folding stats
   */
  getStats: async (user, team) => {
    const params = {};
    if (user) params.user = user;
    if (team) params.team = team;
    
    const response = await api.get('/folding/stats', { params });
    return response.data.data;
  },

  /**
   * Get Folding@Home status for an instance
   * @param {string} instanceId - Instance ID
   * @returns {Promise} - Promise with folding status
   */
  getInstanceStatus: async (instanceId) => {
    const response = await api.get(`/folding/instances/${instanceId}/status`);
    return response.data.data;
  },
  
  /**
   * Get GPU performance data for comparison charts
   * @param {string} chartType - Type of chart (performancePerDollar, rawPerformance, availability)
   * @returns {Promise} - Promise with GPU performance data
   */
  getGpuPerformanceData: async (chartType) => {
    const response = await api.get('/folding/gpu-performance', { params: { chartType } });
    return response.data.data;
  }
};

export default FoldingService;