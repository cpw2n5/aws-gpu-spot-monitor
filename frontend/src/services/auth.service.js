import api from './api';

/**
 * Authentication service for handling user authentication operations
 */
const AuthService = {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} attributes - Additional user attributes
   * @returns {Promise} - Promise with registration result
   */
  register: async (email, password, attributes = {}) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      ...attributes
    });
    return response.data;
  },

  /**
   * Confirm user registration with confirmation code
   * @param {string} email - User email
   * @param {string} confirmationCode - Confirmation code
   * @returns {Promise} - Promise with confirmation result
   */
  confirmRegistration: async (email, confirmationCode) => {
    const response = await api.post('/auth/confirm', {
      email,
      confirmationCode
    });
    return response.data;
  },

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with login result
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    const { accessToken, refreshToken } = response.data.data;
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  /**
   * Logout the current user
   * @returns {Promise} - Promise with logout result
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  /**
   * Get the current user profile
   * @returns {Promise} - Promise with user profile
   */
  getUserProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  /**
   * Initiate forgot password flow
   * @param {string} email - User email
   * @returns {Promise} - Promise with forgot password result
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with confirmation code
   * @param {string} email - User email
   * @param {string} confirmationCode - Confirmation code
   * @param {string} newPassword - New password
   * @returns {Promise} - Promise with reset password result
   */
  resetPassword: async (email, confirmationCode, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      confirmationCode,
      newPassword
    });
    return response.data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};

export default AuthService;