// Nexus MCP Hub Admin Dashboard

// API base URL
const API_BASE_URL = '';

// Axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response && error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        app.isAuthenticated = false;
        app.user = null;
    }
    return Promise.reject(error);
});

// Vue application
const app = new Vue({
    el: '#app',
    data: {
        // Authentication
        isAuthenticated: false,
        user: null,
        loginForm: {
            username: '',
            password: ''
        },
        loginError: null,
        
        // Navigation
        currentPage: 'dashboard',
        
        // Dashboard
        stats: {},
        
        // Servers
        servers: [],
        showAddServerModal: false,
        newServer: {
            id: '',
            name: '',
            command: '',
            args: '',
            auto_start: true,
            auto_restart: true
        },
        
        // Clients
        clients: [],
        mcp_clients: {},
        
        // Routes
        routes: [],
        
        // Users
        users: {}
    },
    computed: {
        isAdmin() {
            if (!this.user) return false;
            return this.user.roles && this.user.roles.includes('admin');
        }
    },
    created() {
        // Check if user is already authenticated
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            this.isAuthenticated = true;
            this.user = JSON.parse(user);
            
            // Load initial data
            this.loadDashboard();
            
            // Set up page routing
            this.setupRouting();
        }
    },
    methods: {
        // Authentication
        async login() {
            this.loginError = null;
            
            try {
                const response = await api.post('/api/auth/login', {
                    credentials: {
                        username: this.loginForm.username,
                        password: this.loginForm.password
                    }
                });
                
                const { token, user } = response.data;
                
                // Store token and user info
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Update app state
                this.isAuthenticated = true;
                this.user = user;
                
                // Load initial data
                this.loadDashboard();
                
                // Set up page routing
                this.setupRouting();
            } catch (error) {
                console.error('Login error:', error);
                this.loginError = 'Invalid username or password';
            }
        },
        
        async logout() {
            try {
                await api.post('/api/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // Clear token and user info
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Update app state
                this.isAuthenticated = false;
                this.user = null;
            }
        },
        
        // Routing
        setupRouting() {
            // Parse hash from URL
            const hash = window.location.hash.substring(1);
            if (hash) {
                const page = hash.split('/')[1];
                if (page) {
                    this.currentPage = page;
                }
            }
            
            // Listen for hash changes
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.substring(1);
                if (hash) {
                    const page = hash.split('/')[1];
                    if (page) {
                        this.currentPage = page;
                    }
                }
            });
        },
        
        // Dashboard
        async loadDashboard() {
            try {
                const response = await api.get('/api/dashboard/status');
                this.stats = response.data;
                
                // Load servers
                this.loadServers();
                
                // Load clients
                this.loadClients();
                
                // Load routes
                this.loadRoutes();
                
                // Load users if admin
                if (this.isAdmin) {
                    this.loadUsers();
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        },
        
        // Servers
        async loadServers() {
            try {
                const response = await api.get('/api/dashboard/servers');
                this.servers = response.data.servers;
            } catch (error) {
                console.error('Error loading servers:', error);
            }
        },
        
        async startServer(serverId) {
            try {
                await api.post(`/api/servers/${serverId}/start`);
                // Reload servers
                this.loadServers();
            } catch (error) {
                console.error(`Error starting server ${serverId}:`, error);
                alert(`Failed to start server: ${error.response?.data?.error || error.message}`);
            }
        },
        
        async stopServer(serverId) {
            try {
                await api.post(`/api/servers/${serverId}/stop`);
                // Reload servers
                this.loadServers();
            } catch (error) {
                console.error(`Error stopping server ${serverId}:`, error);
                alert(`Failed to stop server: ${error.response?.data?.error || error.message}`);
            }
        },
        
        async restartServer(serverId) {
            try {
                await api.post(`/api/servers/${serverId}/restart`);
                // Reload servers
                this.loadServers();
            } catch (error) {
                console.error(`Error restarting server ${serverId}:`, error);
                alert(`Failed to restart server: ${error.response?.data?.error || error.message}`);
            }
        },
        
        viewServerDetails(serverId) {
            // Navigate to server details page
            window.location.hash = `/server/${serverId}`;
        },
        
        async addServer() {
            try {
                // Parse args string to array
                const args = this.newServer.args.split(' ').filter(arg => arg.trim() !== '');
                
                // Prepare server config
                const serverConfig = {
                    id: this.newServer.id,
                    config: {
                        name: this.newServer.name,
                        command: this.newServer.command,
                        args: args,
                        auto_start: this.newServer.auto_start,
                        auto_restart: this.newServer.auto_restart
                    }
                };
                
                // Register server
                await api.post('/api/servers', serverConfig);
                
                // Close modal and reset form
                this.showAddServerModal = false;
                this.newServer = {
                    id: '',
                    name: '',
                    command: '',
                    args: '',
                    auto_start: true,
                    auto_restart: true
                };
                
                // Reload servers
                this.loadServers();
            } catch (error) {
                console.error('Error adding server:', error);
                alert(`Failed to add server: ${error.response?.data?.error || error.message}`);
            }
        },
        
        // Clients
        async loadClients() {
            try {
                const response = await api.get('/api/dashboard/clients');
                this.clients = response.data.clients;
                this.mcp_clients = response.data.mcp_clients;
            } catch (error) {
                console.error('Error loading clients:', error);
            }
        },
        
        // Routes
        async loadRoutes() {
            try {
                const response = await api.get('/api/dashboard/routes');
                this.routes = response.data.routes;
            } catch (error) {
                console.error('Error loading routes:', error);
            }
        },
        
        // Users
        async loadUsers() {
            try {
                const response = await api.get('/api/dashboard/users');
                this.users = response.data.users;
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }
    }
});
