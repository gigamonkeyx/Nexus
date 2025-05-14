/**
 * Configuration file for the Nexus Integrated UI
 */

// API URL - Change this to your API server URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// MCP Hub URL - Change this to your MCP Hub URL
export const MCP_HUB_URL = process.env.REACT_APP_MCP_HUB_URL || 'http://localhost:8000';

// Documentation URL - Change this to your documentation URL
export const DOCS_URL = process.env.REACT_APP_DOCS_URL || 'http://localhost:3002';

// Application name
export const APP_NAME = 'Nexus Agent Portal';

// Theme configuration
export const THEME_CONFIG = {
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  backgroundColor: '#f5f5f5',
  textColor: '#333333',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
};

// Feature flags
export const FEATURES = {
  enableAgents: true,
  enableTasks: true,
  enableBenchmarks: true,
  enableDocumentation: true,
  enableMCPServers: true,
  enableSettings: true,
};

// Default pagination settings
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
};

// Authentication settings
export const AUTH_CONFIG = {
  tokenStorageKey: 'token',
  refreshTokenStorageKey: 'refreshToken',
  tokenExpiryKey: 'tokenExpiry',
};

// Export default configuration
export default {
  API_URL,
  MCP_HUB_URL,
  DOCS_URL,
  APP_NAME,
  THEME_CONFIG,
  FEATURES,
  PAGINATION,
  AUTH_CONFIG,
};
