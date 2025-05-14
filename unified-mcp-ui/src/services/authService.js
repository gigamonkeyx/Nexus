import axios from 'axios';

// Constants
const AUTH_KEY = 'mcp_portal_auth';
const NEXUS_API_URL = process.env.REACT_APP_NEXUS_API_URL || 'https://nexus.yourdomain.com/api';

// Helper to get auth data from local storage
const getAuthData = () => {
  const authData = localStorage.getItem(AUTH_KEY);
  
  if (!authData) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(authData);
    
    // Check if token is expired (24 hours)
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
};

// Login function
const login = async (credentials) => {
  try {
    const response = await axios.post(`${NEXUS_API_URL}/auth/login`, { credentials });
    
    if (response.data && response.data.token) {
      const authData = {
        token: response.data.token,
        user: response.data.user,
        timestamp: Date.now()
      };
      
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      return response.data.user;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error(error.response?.data?.detail || 'Authentication failed');
  }
};

// Logout function
const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

// Get current user
const getCurrentUser = async () => {
  const authData = getAuthData();
  
  if (!authData) {
    return null;
  }
  
  return authData.user;
};

// Get auth token
const getToken = () => {
  const authData = getAuthData();
  return authData ? authData.token : null;
};

// Check if user is authenticated
const isAuthenticated = () => {
  return getToken() !== null;
};

// Create axios instance with auth header
const createAuthenticatedAxios = () => {
  const token = getToken();
  
  if (!token) {
    return axios;
  }
  
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  createAuthenticatedAxios
};
