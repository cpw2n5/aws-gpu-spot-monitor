import React, { createContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/auth.service';

// Create the authentication context
export const AuthContext = createContext();

/**
 * Authentication context provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const userProfile = await AuthService.getUserProfile();
          setCurrentUser(userProfile);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        // If there's an error loading the profile, clear tokens
        AuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} attributes - Additional user attributes
   */
  const register = useCallback(async (email, password, attributes = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.register(email, password, attributes);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirm user registration
   * @param {string} email - User email
   * @param {string} confirmationCode - Confirmation code
   */
  const confirmRegistration = useCallback(async (email, confirmationCode) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.confirmRegistration(email, confirmationCode);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Confirmation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.login(email, password);
      const userProfile = await AuthService.getUserProfile();
      setCurrentUser(userProfile);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initiate forgot password flow
   * @param {string} email - User email
   */
  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.forgotPassword(email);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Forgot password request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password with confirmation code
   * @param {string} email - User email
   * @param {string} confirmationCode - Confirmation code
   * @param {string} newPassword - New password
   */
  const resetPassword = useCallback(async (email, confirmationCode, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.resetPassword(email, confirmationCode, newPassword);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {Object} updatedProfile - Updated user profile data
   */
  const updateProfile = useCallback(async (updatedProfile) => {
    setLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the backend
      // const result = await AuthService.updateProfile(updatedProfile);
      // setCurrentUser(result);
      // return result;
      
      // For now, just update the local state
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      return currentUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    register,
    confirmRegistration,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};