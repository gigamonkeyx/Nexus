import { authService } from './authService';

// Constants
const NEXUS_API_URL = process.env.REACT_APP_NEXUS_API_URL || 'https://nexus.yourdomain.com/api';

// Create authenticated axios instance
const api = () => authService.createAuthenticatedAxios();

// Get hub status
const getHubStatus = async () => {
  try {
    const response = await api().get(`${NEXUS_API_URL}/hub/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hub status:', error);
    throw error;
  }
};

// Get all servers
const getAllServers = async () => {
  try {
    const response = await api().get(`${NEXUS_API_URL}/servers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching servers:', error);
    throw error;
  }
};

// Get server by ID
const getServerById = async (id) => {
  try {
    const response = await api().get(`${NEXUS_API_URL}/servers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching server ${id}:`, error);
    throw error;
  }
};

// Register a new server
const registerServer = async (serverData) => {
  try {
    const response = await api().post(`${NEXUS_API_URL}/servers`, serverData);
    return response.data;
  } catch (error) {
    console.error('Error registering server:', error);
    throw error;
  }
};

// Connect to a server
const connectServer = async (id) => {
  try {
    const response = await api().post(`${NEXUS_API_URL}/servers/${id}/connect`);
    return response.data;
  } catch (error) {
    console.error(`Error connecting to server ${id}:`, error);
    throw error;
  }
};

// Disconnect from a server
const disconnectServer = async (id) => {
  try {
    const response = await api().post(`${NEXUS_API_URL}/servers/${id}/disconnect`);
    return response.data;
  } catch (error) {
    console.error(`Error disconnecting from server ${id}:`, error);
    throw error;
  }
};

// Call a tool on a server
const callServerTool = async (serverId, toolName, params) => {
  try {
    const response = await api().post(`${NEXUS_API_URL}/servers/${serverId}/tools/${toolName}`, params);
    return response.data;
  } catch (error) {
    console.error(`Error calling tool ${toolName} on server ${serverId}:`, error);
    throw error;
  }
};

// Get a resource from a server
const getServerResource = async (serverId, resourcePath) => {
  try {
    const response = await api().get(`${NEXUS_API_URL}/servers/${serverId}/resources/${resourcePath}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting resource ${resourcePath} from server ${serverId}:`, error);
    throw error;
  }
};

export const nexusService = {
  getHubStatus,
  getAllServers,
  getServerById,
  registerServer,
  connectServer,
  disconnectServer,
  callServerTool,
  getServerResource
};
