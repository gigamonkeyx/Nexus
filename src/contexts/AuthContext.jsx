import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const AuthContext = createContext();

/**
 * AuthProvider component
 * Provides authentication state and methods to the app
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For demo purposes, we'll simulate authentication
  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentUser({ name: 'Demo User', email: 'demo@example.com' });
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  /**
   * Login user
   * @param {Object} credentials - User credentials (email, password)
   * @returns {boolean} - Success status
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll accept any credentials
      if (credentials.email && credentials.password) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = { name: 'Demo User', email: credentials.email };
        const token = 'demo-token-123456';
        
        localStorage.setItem('token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setLoading(false);
        
        return true;
      } else {
        throw new Error('Email and password are required');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  /**
   * Register new user
   * @param {Object} userData - User data (name, email, password)
   * @returns {boolean} - Success status
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll accept any valid data
      if (userData.name && userData.email && userData.password) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = { name: userData.name, email: userData.email };
        const token = 'demo-token-123456';
        
        localStorage.setItem('token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setLoading(false);
        
        return true;
      } else {
        throw new Error('Name, email, and password are required');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Object} - Updated user data
   */
  const updateProfile = async (profileData) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { ...currentUser, ...profileData };
      setCurrentUser(updatedUser);
      setLoading(false);
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.message || 'Failed to update profile');
      setLoading(false);
      throw error;
    }
  };

  /**
   * Change user password
   * @param {Object} passwordData - Password data (currentPassword, newPassword)
   * @returns {boolean} - Success status
   */
  const changePassword = async (passwordData) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      setError(error.message || 'Failed to change password');
      setLoading(false);
      throw error;
    }
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 * @returns {Object} - Auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
