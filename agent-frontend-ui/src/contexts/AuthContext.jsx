import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`);
      setCurrentUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user and authentication state
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Register function
  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Failed to register');
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
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
