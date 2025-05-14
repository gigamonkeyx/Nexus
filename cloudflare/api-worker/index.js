/**
 * Nexus MCP Hub API Worker
 * 
 * This worker serves as an API proxy for the Nexus MCP Hub, handling authentication,
 * routing, and communication with the local MCP servers.
 */

// Configuration
const config = {
  // JWT secret for authentication
  JWT_SECRET: 'your-jwt-secret', // Replace with environment variable in production
  
  // Token expiration time (1 day)
  TOKEN_EXPIRATION: 86400,
  
  // Local MCP Hub URL
  LOCAL_MCP_HUB_URL: 'http://localhost:3000',
  
  // CORS allowed origins
  ALLOWED_ORIGINS: [
    'https://nexus-agent-portal.pages.dev',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  
  // Mock data for development
  MOCK_DATA: {
    enabled: true, // Set to false in production
    users: [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // In production, use hashed passwords
        role: 'admin'
      }
    ]
  }
};

// Import JWT library
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

// Handle requests
export default {
  async fetch(request, env, ctx) {
    // Parse request URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }
    
    // Add CORS headers to all responses
    const corsHeaders = getCORSHeaders(request);
    
    try {
      // API routes
      if (path.startsWith('/api/')) {
        // Auth routes
        if (path.startsWith('/api/auth/')) {
          return handleAuthRoutes(request, corsHeaders);
        }
        
        // Protected routes - verify token
        const token = getTokenFromRequest(request);
        if (!token) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        try {
          const isValid = await verify(token, config.JWT_SECRET);
          if (!isValid) {
            throw new Error('Invalid token');
          }
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Agent routes
        if (path.startsWith('/api/agents')) {
          return handleAgentRoutes(request, corsHeaders);
        }
        
        // Task routes
        if (path.startsWith('/api/tasks')) {
          return handleTaskRoutes(request, corsHeaders);
        }
        
        // Benchmark routes
        if (path.startsWith('/api/benchmarks')) {
          return handleBenchmarkRoutes(request, corsHeaders);
        }
        
        // Server routes
        if (path.startsWith('/api/servers')) {
          return handleServerRoutes(request, corsHeaders);
        }
        
        // Unknown API route
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Unknown route
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      // Handle errors
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

// Handle CORS preflight requests
function handleCORS(request) {
  const headers = getCORSHeaders(request);
  
  return new Response(null, {
    status: 204,
    headers
  });
}

// Get CORS headers
function getCORSHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = config.ALLOWED_ORIGINS.includes(origin) ? origin : config.ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Get token from request
function getTokenFromRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

// Handle authentication routes
async function handleAuthRoutes(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Login route
  if (path === '/api/auth/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json();
      
      // In production, this would validate against a database
      if (config.MOCK_DATA.enabled) {
        const user = config.MOCK_DATA.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Create JWT token
        const token = await sign(
          { 
            sub: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + config.TOKEN_EXPIRATION
          },
          config.JWT_SECRET
        );
        
        // Return user and token
        return new Response(JSON.stringify({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        // In production, forward to actual backend
        // const response = await fetch(`${config.LOCAL_MCP_HUB_URL}/auth/login`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ email, password })
        // });
        // 
        // return new Response(await response.text(), {
        //   status: response.status,
        //   headers: {
        //     'Content-Type': 'application/json',
        //     ...corsHeaders
        //   }
        // });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // Register route
  if (path === '/api/auth/register' && request.method === 'POST') {
    try {
      const { name, email, password } = await request.json();
      
      // In production, this would create a user in the database
      if (config.MOCK_DATA.enabled) {
        // Check if user already exists
        if (config.MOCK_DATA.users.some(u => u.email === email)) {
          return new Response(JSON.stringify({ error: 'User already exists' }), {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // In a real implementation, we would create the user in a database
        return new Response(JSON.stringify({ message: 'User registered successfully' }), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        // In production, forward to actual backend
        // const response = await fetch(`${config.LOCAL_MCP_HUB_URL}/auth/register`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ name, email, password })
        // });
        // 
        // return new Response(await response.text(), {
        //   status: response.status,
        //   headers: {
        //     'Content-Type': 'application/json',
        //     ...corsHeaders
        //   }
        // });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // Profile route
  if (path === '/api/auth/profile' && request.method === 'GET') {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    try {
      const decoded = await verify(token, config.JWT_SECRET);
      
      if (!decoded.valid) {
        throw new Error('Invalid token');
      }
      
      // In production, fetch user from database
      if (config.MOCK_DATA.enabled) {
        const user = config.MOCK_DATA.users.find(u => u.id === decoded.payload.sub);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        return new Response(JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        // In production, forward to actual backend
        // const response = await fetch(`${config.LOCAL_MCP_HUB_URL}/auth/profile`, {
        //   method: 'GET',
        //   headers: { 
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        // 
        // return new Response(await response.text(), {
        //   status: response.status,
        //   headers: {
        //     'Content-Type': 'application/json',
        //     ...corsHeaders
        //   }
        // });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // Unknown auth route
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle agent routes
async function handleAgentRoutes(request, corsHeaders) {
  // In a real implementation, these would interact with the local MCP Hub
  // For now, we'll return mock data
  
  const url = new URL(request.url);
  const path = url.pathname;
  
  // GET /api/agents - Get all agents
  if (path === '/api/agents' && request.method === 'GET') {
    return new Response(JSON.stringify([
      {
        id: '1',
        name: 'Research Assistant',
        type: 'research',
        status: 'running',
        description: 'An agent that helps with research tasks',
        capabilities: ['research', 'reasoning', 'planning'],
        createdAt: '2023-06-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Code Helper',
        type: 'coding',
        status: 'stopped',
        description: 'An agent that helps with coding tasks',
        capabilities: ['code_generation', 'reasoning'],
        createdAt: '2023-06-20T14:45:00Z'
      },
      {
        id: '3',
        name: 'Data Analyst',
        type: 'data',
        status: 'running',
        description: 'An agent that helps with data analysis',
        capabilities: ['data_analysis', 'reasoning'],
        createdAt: '2023-07-05T09:15:00Z'
      }
    ]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Other agent routes would be implemented here
  
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle task routes
async function handleTaskRoutes(request, corsHeaders) {
  // Mock implementation
  const url = new URL(request.url);
  const path = url.pathname;
  
  // GET /api/tasks - Get all tasks
  if (path === '/api/tasks' && request.method === 'GET') {
    return new Response(JSON.stringify([
      {
        id: '1',
        name: 'Research quantum computing',
        description: 'Gather information about recent advances in quantum computing',
        status: 'completed',
        priority: 'high',
        agentId: '1',
        agentName: 'Research Assistant',
        createdAt: '2023-06-16T10:30:00Z',
        completedAt: '2023-06-16T11:45:00Z'
      },
      {
        id: '2',
        name: 'Optimize database queries',
        description: 'Review and optimize slow database queries',
        status: 'in_progress',
        priority: 'medium',
        agentId: '2',
        agentName: 'Code Helper',
        createdAt: '2023-06-21T14:45:00Z'
      },
      {
        id: '3',
        name: 'Analyze sales data',
        description: 'Analyze Q2 sales data and generate insights',
        status: 'pending',
        priority: 'high',
        agentId: null,
        agentName: null,
        createdAt: '2023-07-06T09:15:00Z'
      }
    ]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Other task routes would be implemented here
  
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle benchmark routes
async function handleBenchmarkRoutes(request, corsHeaders) {
  // Mock implementation
  const url = new URL(request.url);
  const path = url.pathname;
  
  // GET /api/benchmarks - Get all benchmarks
  if (path === '/api/benchmarks' && request.method === 'GET') {
    return new Response(JSON.stringify([
      {
        id: '1',
        name: 'HumanEval Benchmark',
        type: 'humaneval',
        agentId: '2',
        agentName: 'Code Helper',
        score: 0.75,
        date: '2023-06-25T10:30:00Z'
      },
      {
        id: '2',
        name: 'τ-Bench Reasoning',
        type: 'taubench',
        agentId: '1',
        agentName: 'Research Assistant',
        score: 0.82,
        date: '2023-07-10T14:45:00Z'
      },
      {
        id: '3',
        name: 'Custom Data Analysis',
        type: 'custom',
        agentId: '3',
        agentName: 'Data Analyst',
        score: 0.91,
        date: '2023-07-15T09:15:00Z'
      }
    ]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Other benchmark routes would be implemented here
  
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle server routes
async function handleServerRoutes(request, corsHeaders) {
  // Mock implementation
  const url = new URL(request.url);
  const path = url.pathname;
  
  // GET /api/servers - Get all MCP servers
  if (path === '/api/servers' && request.method === 'GET') {
    return new Response(JSON.stringify([
      {
        id: '1',
        name: 'Ollama MCP',
        type: 'ollama',
        url: 'http://localhost:3011',
        status: 'connected',
        capabilities: ['text_generation', 'code_generation', 'embedding_generation']
      },
      {
        id: '2',
        name: 'ComfyUI MCP',
        type: 'comfyui',
        url: 'http://localhost:3020',
        status: 'connected',
        capabilities: ['image_generation', 'image_editing']
      },
      {
        id: '3',
        name: 'Supabase MCP',
        type: 'supabase',
        url: 'http://localhost:3007',
        status: 'connected',
        capabilities: ['database', 'storage', 'authentication']
      },
      {
        id: '4',
        name: 'Terminal MCP',
        type: 'terminal',
        url: 'http://localhost:3014',
        status: 'connected',
        capabilities: ['command_execution', 'file_system']
      }
    ]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Other server routes would be implemented here
  
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
