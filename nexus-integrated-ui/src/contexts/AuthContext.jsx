import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, AUTH_CONFIG } from '../config';
import { authApi } from '../services/api';

// Create context
const AuthContext = createContext();

/**
 * AuthProvider component
 * Provides authentication state and methods to the application
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.tokenStorageKey);
    if (token) {
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const user = await authApi.getProfile();
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setError(null);
    try {
      // Use the authApi from our services
      const { token, user } = await authApi.login(credentials);
      
      // Save token to localStorage
      localStorage.setItem(AUTH_CONFIG.tokenStorageKey, token);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user and authentication state
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      return false;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      await authApi.register(userData);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authApi.updateProfile(userData);
      setCurrentUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await authApi.changePassword(passwordData);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
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
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
