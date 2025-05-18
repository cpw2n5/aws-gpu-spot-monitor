import api from './api';

/**
 * Service for handling instance related operations
 */
const InstanceService = {
  /**
   * Request a new spot instance
   * @param {Object} instanceConfig - Instance configuration
   * @param {string} instanceConfig.instanceType - EC2 instance type
   * @param {string} instanceConfig.region - AWS region
   * @param {number} instanceConfig.maxPrice - Maximum price willing to pay
   * @param {string} instanceConfig.keyName - Optional EC2 key pair name
   * @param {string} instanceConfig.securityGroupId - Optional security group ID
   * @param {string} instanceConfig.subnetId - Optional subnet ID
   * @param {Object} instanceConfig.foldingConfig - Optional Folding@Home configuration
   * @returns {Promise} - Promise with new instance details
   */
  requestSpotInstance: async (instanceConfig) => {
    const response = await api.post('/instances', instanceConfig);
    return response.data.data;
  },

  /**
   * List instances for the current user
   * @returns {Promise} - Promise with list of instances
   */
  listInstances: async () => {
    const response = await api.get('/instances');
    return response.data.data.instances;
  },

  /**
   * Get instance details
   * @param {string} instanceId - Instance ID
   * @returns {Promise} - Promise with instance details
   */
  getInstance: async (instanceId) => {
    const response = await api.get(`/instances/${instanceId}`);
    return response.data.data;
  },

  /**
   * Update instance status (refresh)
   * @param {string} instanceId - Instance ID
   * @returns {Promise} - Promise with updated instance details
   */
  updateInstanceStatus: async (instanceId) => {
    const response = await api.put(`/instances/${instanceId}/status`);
    return response.data.data;
  },

  /**
   * Terminate an instance
   * @param {string} instanceId - Instance ID
   * @returns {Promise} - Promise with termination result
   */
  terminateInstance: async (instanceId) => {
    const response = await api.delete(`/instances/${instanceId}`);
    return response.data.data;
  }
};

export default InstanceService;