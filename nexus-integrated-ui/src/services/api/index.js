import axios from 'axios';
import { API_URL } from '../../config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Agent API
export const agentApi = {
  // Get all agents
  getAgents: async () => {
    try {
      const response = await api.get('/agents');
      return response.data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  // Get agent by ID
  getAgent: async (id) => {
    try {
      const response = await api.get(`/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  },

  // Create agent
  createAgent: async (agent) => {
    try {
      const response = await api.post('/agents', agent);
      return response.data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },

  // Update agent
  updateAgent: async (id, agent) => {
    try {
      const response = await api.put(`/agents/${id}`, agent);
      return response.data;
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  },

  // Delete agent
  deleteAgent: async (id) => {
    try {
      const response = await api.delete(`/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  },

  // Start agent
  startAgent: async (id) => {
    try {
      const response = await api.post(`/agents/${id}/start`);
      return response.data;
    } catch (error) {
      console.error(`Error starting agent ${id}:`, error);
      throw error;
    }
  },

  // Stop agent
  stopAgent: async (id) => {
    try {
      const response = await api.post(`/agents/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error(`Error stopping agent ${id}:`, error);
      throw error;
    }
  },

  // Get agent logs
  getAgentLogs: async (id) => {
    try {
      const response = await api.get(`/agents/${id}/logs`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching logs for agent ${id}:`, error);
      throw error;
    }
  }
};

// Task API
export const taskApi = {
  // Get all tasks
  getTasks: async (params) => {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get task by ID
  getTask: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  },

  // Create task
  createTask: async (task) => {
    try {
      const response = await api.post('/tasks', task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update task
  updateTask: async (id, task) => {
    try {
      const response = await api.put(`/tasks/${id}`, task);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  },

  // Assign task to agent
  assignTask: async (id, agentId) => {
    try {
      const response = await api.post(`/tasks/${id}/assign`, { agentId });
      return response.data;
    } catch (error) {
      console.error(`Error assigning task ${id} to agent:`, error);
      throw error;
    }
  },

  // Complete task
  completeTask: async (id) => {
    try {
      const response = await api.post(`/tasks/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error completing task ${id}:`, error);
      throw error;
    }
  }
};

// Benchmark API
export const benchmarkApi = {
  // Get all benchmarks
  getBenchmarks: async (params) => {
    try {
      const response = await api.get('/benchmarks', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      throw error;
    }
  },

  // Get benchmark by ID
  getBenchmark: async (id) => {
    try {
      const response = await api.get(`/benchmarks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching benchmark ${id}:`, error);
      throw error;
    }
  },

  // Run benchmark
  runBenchmark: async (benchmark) => {
    try {
      const response = await api.post('/benchmarks', benchmark);
      return response.data;
    } catch (error) {
      console.error('Error running benchmark:', error);
      throw error;
    }
  },

  // Delete benchmark
  deleteBenchmark: async (id) => {
    try {
      const response = await api.delete(`/benchmarks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting benchmark ${id}:`, error);
      throw error;
    }
  }
};

// MCP Server API
export const mcpServerApi = {
  // Get all MCP servers
  getMCPServers: async () => {
    try {
      const response = await api.get('/mcp-servers');
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      throw error;
    }
  },

  // Get MCP server by ID
  getMCPServer: async (id) => {
    try {
      const response = await api.get(`/mcp-servers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching MCP server ${id}:`, error);
      throw error;
    }
  },

  // Register MCP server
  registerMCPServer: async (server) => {
    try {
      const response = await api.post('/mcp-servers', server);
      return response.data;
    } catch (error) {
      console.error('Error registering MCP server:', error);
      throw error;
    }
  },

  // Update MCP server
  updateMCPServer: async (id, server) => {
    try {
      const response = await api.put(`/mcp-servers/${id}`, server);
      return response.data;
    } catch (error) {
      console.error(`Error updating MCP server ${id}:`, error);
      throw error;
    }
  },

  // Delete MCP server
  deleteMCPServer: async (id) => {
    try {
      const response = await api.delete(`/mcp-servers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting MCP server ${id}:`, error);
      throw error;
    }
  },

  // Test MCP server connection
  testMCPServerConnection: async (id) => {
    try {
      const response = await api.post(`/mcp-servers/${id}/test`);
      return response.data;
    } catch (error) {
      console.error(`Error testing connection to MCP server ${id}:`, error);
      throw error;
    }
  }
};

// Documentation API
export const docsApi = {
  // Get all documentation
  getDocs: async () => {
    try {
      const response = await api.get('/docs');
      return response.data;
    } catch (error) {
      console.error('Error fetching documentation:', error);
      throw error;
    }
  },

  // Search documentation
  searchDocs: async (query) => {
    try {
      const response = await api.get('/docs/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error(`Error searching documentation for "${query}":`, error);
      throw error;
    }
  }
};

// Auth API
export const authApi = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
};

export default api;
