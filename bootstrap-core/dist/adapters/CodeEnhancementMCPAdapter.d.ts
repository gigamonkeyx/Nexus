/**
 * Code Enhancement MCP Adapter
 *
 * Adapter for the Code Enhancement MCP server.
 */
import { NexusClient } from '../core/NexusClient';
export interface CodeEnhancementOptions {
    addDocumentation?: boolean;
    addErrorHandling?: boolean;
    addLogging?: boolean;
    improvePerformance?: boolean;
    improveReadability?: boolean;
    [key: string]: any;
}
export declare class CodeEnhancementMCPAdapter {
    private nexusClient;
    private serverId;
    constructor(nexusClient: NexusClient, serverId: string);
    /**
     * Get the server ID
     */
    getServerId(): string;
    /**
     * Enhance code
     */
    enhanceCode(code: string, language: string, options?: CodeEnhancementOptions): Promise<string>;
    /**
     * Format code
     */
    formatCode(code: string, language: string): Promise<string>;
    /**
     * Refactor code
     */
    refactorCode(code: string, language: string, refactoringType: 'extract-method' | 'rename-variable' | 'simplify' | 'optimize', options?: any): Promise<string>;
    /**
     * Generate tests for code
     */
    generateTests(code: string, language: string, options?: any): Promise<string>;
}
