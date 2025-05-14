import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Nexus MCP Client for VS Code extension
 */
export class NexusClient {
    private axios: AxiosInstance;
    private clientId: string;
    private token: string | undefined;
    private connected: boolean = false;
    private statusBarItem: vscode.StatusBarItem;
    private serverTreeProvider: vscode.TreeDataProvider<any> | undefined;
    private toolsTreeProvider: vscode.TreeDataProvider<any> | undefined;

    constructor() {
        // Create a unique client ID
        this.clientId = vscode.workspace.getConfiguration('augmentNexusClient').get('clientId') as string;
        if (!this.clientId) {
            this.clientId = uuidv4();
            vscode.workspace.getConfiguration('augmentNexusClient').update('clientId', this.clientId, true);
        }

        // Get hub URL from configuration
        const hubUrl = vscode.workspace.getConfiguration('augmentNexusClient').get('hubUrl') as string;
        
        // Create axios instance
        this.axios = axios.create({
            baseURL: hubUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.text = "$(plug) Nexus: Disconnected";
        this.statusBarItem.command = 'augment-nexus-client.connect';
        this.statusBarItem.show();

        // Get token from configuration
        this.token = vscode.workspace.getConfiguration('augmentNexusClient').get('token') as string;
        if (this.token) {
            this.setAuthToken(this.token);
        }
    }

    /**
     * Set authentication token for API requests
     * @param token Authentication token
     */
    public setAuthToken(token: string): void {
        this.token = token;
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        vscode.workspace.getConfiguration('augmentNexusClient').update('token', token, true);
    }

    /**
     * Connect to Nexus Hub
     */
    public async connect(): Promise<boolean> {
        try {
            // Check if already connected
            if (this.connected) {
                vscode.window.showInformationMessage('Already connected to Nexus Hub');
                return true;
            }

            // Check if we have a token
            if (!this.token) {
                // Get username and password
                const username = await vscode.window.showInputBox({
                    prompt: 'Enter Nexus Hub username',
                    placeHolder: 'Username'
                });

                if (!username) {
                    return false;
                }

                const password = await vscode.window.showInputBox({
                    prompt: 'Enter Nexus Hub password',
                    placeHolder: 'Password',
                    password: true
                });

                if (!password) {
                    return false;
                }

                // Authenticate
                const response = await this.axios.post('/api/auth/login', {
                    credentials: {
                        username,
                        password
                    }
                });

                // Set token
                this.setAuthToken(response.data.token);
            } else {
                // Validate token
                const response = await this.axios.post('/api/auth/validate', {
                    token: this.token
                });

                if (!response.data.valid) {
                    // Token is invalid, clear it
                    this.token = undefined;
                    this.axios.defaults.headers.common['Authorization'] = undefined;
                    vscode.workspace.getConfiguration('augmentNexusClient').update('token', undefined, true);
                    
                    // Try to connect again
                    return await this.connect();
                }
            }

            // Register client with Nexus Hub
            await this.registerClient();

            // Update status
            this.connected = true;
            this.statusBarItem.text = "$(plug) Nexus: Connected";
            this.statusBarItem.command = 'augment-nexus-client.disconnect';

            // Refresh server list
            if (this.serverTreeProvider) {
                (this.serverTreeProvider as any).refresh();
            }

            vscode.window.showInformationMessage('Connected to Nexus Hub');
            return true;
        } catch (error) {
            console.error('Error connecting to Nexus Hub:', error);
            vscode.window.showErrorMessage(`Failed to connect to Nexus Hub: ${error.message}`);
            return false;
        }
    }

    /**
     * Disconnect from Nexus Hub
     */
    public async disconnect(): Promise<void> {
        try {
            if (!this.connected) {
                return;
            }

            // Logout
            if (this.token) {
                await this.axios.post('/api/auth/logout');
            }

            // Update status
            this.connected = false;
            this.statusBarItem.text = "$(plug) Nexus: Disconnected";
            this.statusBarItem.command = 'augment-nexus-client.connect';

            // Clear token
            this.token = undefined;
            this.axios.defaults.headers.common['Authorization'] = undefined;
            vscode.workspace.getConfiguration('augmentNexusClient').update('token', undefined, true);

            // Refresh server list
            if (this.serverTreeProvider) {
                (this.serverTreeProvider as any).refresh();
            }

            vscode.window.showInformationMessage('Disconnected from Nexus Hub');
        } catch (error) {
            console.error('Error disconnecting from Nexus Hub:', error);
            vscode.window.showErrorMessage(`Failed to disconnect from Nexus Hub: ${error.message}`);
        }
    }

    /**
     * Register client with Nexus Hub
     */
    private async registerClient(): Promise<void> {
        try {
            // Create MCP client
            await this.axios.post('/api/mcp-clients', {
                id: this.clientId,
                name: `Augment VS Code (${vscode.env.machineId.substring(0, 8)})`
            });

            // Add routes for this client
            await this.axios.post('/api/router/routes', {
                source: {
                    type: 'client',
                    id: this.clientId
                },
                destination: {
                    type: 'all_servers'
                },
                method_pattern: '*'
            });
        } catch (error) {
            console.error('Error registering client with Nexus Hub:', error);
            throw error;
        }
    }

    /**
     * Get all servers
     */
    public async getServers(): Promise<any[]> {
        try {
            if (!this.connected) {
                return [];
            }

            const response = await this.axios.get('/api/servers');
            return Object.values(response.data);
        } catch (error) {
            console.error('Error getting servers:', error);
            vscode.window.showErrorMessage(`Failed to get servers: ${error.message}`);
            return [];
        }
    }

    /**
     * Call a server method
     * @param serverId Server ID
     * @param method Method name
     * @param params Method parameters
     */
    public async callServer(serverId: string, method: string, params: any = {}): Promise<any> {
        try {
            if (!this.connected) {
                throw new Error('Not connected to Nexus Hub');
            }

            // Create message
            const message = {
                id: uuidv4(),
                method,
                params
            };

            // Route message
            const response = await this.axios.post('/api/router/message', {
                message,
                source: {
                    type: 'client',
                    id: this.clientId
                },
                destination: {
                    type: 'server',
                    id: serverId
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error calling server method ${method}:`, error);
            vscode.window.showErrorMessage(`Failed to call server method ${method}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Set server tree provider
     * @param provider Server tree provider
     */
    public setServerTreeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.serverTreeProvider = provider;
    }

    /**
     * Set tools tree provider
     * @param provider Tools tree provider
     */
    public setToolsTreeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.toolsTreeProvider = provider;
    }

    /**
     * Check if connected to Nexus Hub
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Get client ID
     */
    public getClientId(): string {
        return this.clientId;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
