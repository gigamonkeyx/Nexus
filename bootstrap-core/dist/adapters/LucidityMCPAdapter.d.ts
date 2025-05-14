/**
 * Lucidity MCP Adapter
 *
 * Adapter for the Lucidity MCP server.
 */
import { NexusClient } from '../core/NexusClient';
export interface LucidityAnalysisOptions {
    checkQuality?: boolean;
    checkSecurity?: boolean;
    checkPerformance?: boolean;
    checkMaintainability?: boolean;
    [key: string]: any;
}
export declare class LucidityMCPAdapter {
    private nexusClient;
    private serverId;
    constructor(nexusClient: NexusClient, serverId: string);
    /**
     * Get the server ID
     */
    getServerId(): string;
    /**
     * Analyze code
     */
    analyzeCode(code: string, language: string, options?: LucidityAnalysisOptions): Promise<any>;
    /**
     * Analyze a file
     */
    analyzeFile(filePath: string, options?: LucidityAnalysisOptions): Promise<any>;
    /**
     * Analyze a project
     */
    analyzeProject(projectPath: string, options?: LucidityAnalysisOptions): Promise<any>;
    /**
     * Get code metrics
     */
    getCodeMetrics(code: string, language: string): Promise<any>;
    /**
     * Visualize code
     */
    visualizeCode(code: string, language: string, visualizationType: 'dependency-graph' | 'call-graph' | 'class-diagram'): Promise<any>;
}
