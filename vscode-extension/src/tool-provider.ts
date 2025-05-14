import * as vscode from 'vscode';
import { NexusClient } from './nexus-client';

/**
 * Tool tree item
 */
export class ToolTreeItem extends vscode.TreeItem {
    constructor(
        public readonly serverId: string,
        public readonly serverName: string,
        public readonly name: string,
        public readonly description: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = description;
        this.description = `(${serverName})`;
        this.contextValue = 'tool';
        
        // Set icon
        this.iconPath = new vscode.ThemeIcon('tools');
        
        // Set command to call tool
        this.command = {
            command: 'augment-nexus-client.callTool',
            title: 'Call Tool',
            arguments: [this]
        };
    }
}

/**
 * Server group tree item
 */
export class ServerGroupTreeItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly running: boolean
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        
        this.tooltip = label;
        this.contextValue = 'server-group';
        
        // Set icon based on server status
        this.iconPath = new vscode.ThemeIcon(
            running ? 'server-environment' : 'server-process',
            running ? new vscode.ThemeColor('terminal.ansiGreen') : new vscode.ThemeColor('terminal.ansiRed')
        );
    }
}

/**
 * Tool tree data provider
 */
export class ToolProvider implements vscode.TreeDataProvider<ToolTreeItem | ServerGroupTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ToolTreeItem | ServerGroupTreeItem | undefined | null | void> = new vscode.EventEmitter<ToolTreeItem | ServerGroupTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ToolTreeItem | ServerGroupTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private nexusClient: NexusClient) {
        // Register as tools tree provider
        nexusClient.setToolsTreeProvider(this);
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: ToolTreeItem | ServerGroupTreeItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: ToolTreeItem | ServerGroupTreeItem): Promise<(ToolTreeItem | ServerGroupTreeItem)[]> {
        // If not connected, return empty array
        if (!this.nexusClient.isConnected()) {
            return [];
        }
        
        // If no element, return server groups
        if (!element) {
            const servers = await this.nexusClient.getServers();
            
            return servers
                .filter(server => server.running && server.mcp_connected)
                .map(server => new ServerGroupTreeItem(
                    server.id,
                    server.name || server.id,
                    server.running
                ));
        }
        
        // If element is a server group, return tools
        if (element instanceof ServerGroupTreeItem) {
            try {
                // Get server tools
                const response = await this.nexusClient.callServer(
                    element.id,
                    'tools/list',
                    {}
                );
                
                const tools = response.result?.tools || [];
                
                return tools.map((tool: any) => 
                    new ToolTreeItem(
                        element.id,
                        element.label,
                        tool.name,
                        tool.description || 'No description'
                    )
                );
            } catch (error) {
                console.error('Error getting server tools:', error);
                return [];
            }
        }
        
        return [];
    }
}
