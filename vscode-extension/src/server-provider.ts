import * as vscode from 'vscode';
import { NexusClient } from './nexus-client';

/**
 * Server tree item
 */
export class ServerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly description: string,
        public readonly running: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `${label} (${id})`;
        this.description = description;
        this.contextValue = 'server';
        
        // Set icon based on server status
        this.iconPath = new vscode.ThemeIcon(
            running ? 'server-environment' : 'server-process',
            running ? new vscode.ThemeColor('terminal.ansiGreen') : new vscode.ThemeColor('terminal.ansiRed')
        );
    }
}

/**
 * Server capability tree item
 */
export class ServerCapabilityTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = description;
        this.description = description;
        this.contextValue = 'capability';
        
        // Set icon
        this.iconPath = new vscode.ThemeIcon('symbol-method');
    }
}

/**
 * Server tree data provider
 */
export class ServerProvider implements vscode.TreeDataProvider<ServerTreeItem | ServerCapabilityTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ServerTreeItem | ServerCapabilityTreeItem | undefined | null | void> = new vscode.EventEmitter<ServerTreeItem | ServerCapabilityTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ServerTreeItem | ServerCapabilityTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private nexusClient: NexusClient) {
        // Register as server tree provider
        nexusClient.setServerTreeProvider(this);
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: ServerTreeItem | ServerCapabilityTreeItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: ServerTreeItem | ServerCapabilityTreeItem): Promise<(ServerTreeItem | ServerCapabilityTreeItem)[]> {
        // If not connected, return empty array
        if (!this.nexusClient.isConnected()) {
            return [];
        }
        
        // If no element, return servers
        if (!element) {
            const servers = await this.nexusClient.getServers();
            
            return servers.map(server => new ServerTreeItem(
                server.id,
                server.name || server.id,
                server.running ? 'Running' : 'Stopped',
                server.running,
                vscode.TreeItemCollapsibleState.Collapsed
            ));
        }
        
        // If element is a server, return capabilities
        if (element instanceof ServerTreeItem) {
            try {
                // Get server capabilities
                const response = await this.nexusClient.callServer(
                    element.id,
                    'server/describe',
                    {}
                );
                
                const capabilities = response.result?.capabilities || [];
                
                return capabilities.map((capability: string) => 
                    new ServerCapabilityTreeItem(capability, capability)
                );
            } catch (error) {
                console.error('Error getting server capabilities:', error);
                return [];
            }
        }
        
        return [];
    }
}
