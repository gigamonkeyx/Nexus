"use strict";
/**
 * Lucidity MCP Adapter
 *
 * Adapter for the Lucidity MCP server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LucidityMCPAdapter = void 0;
const logger_1 = require("../utils/logger");
class LucidityMCPAdapter {
    constructor(nexusClient, serverId) {
        this.nexusClient = nexusClient;
        this.serverId = serverId;
    }
    /**
     * Get the server ID
     */
    getServerId() {
        return this.serverId;
    }
    /**
     * Analyze code
     */
    async analyzeCode(code, language, options = {}) {
        try {
            logger_1.logger.debug(`Analyzing ${language} code with Lucidity (${this.serverId})`);
            // Create request
            const request = {
                code,
                language,
                options: {
                    checkQuality: true,
                    checkSecurity: true,
                    checkPerformance: true,
                    checkMaintainability: true,
                    ...options
                }
            };
            // Send request to Lucidity MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'analyze', request);
            if (!response) {
                throw new Error('Invalid response from Lucidity MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to analyze code with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze a file
     */
    async analyzeFile(filePath, options = {}) {
        try {
            logger_1.logger.debug(`Analyzing file ${filePath} with Lucidity (${this.serverId})`);
            // Create request
            const request = {
                filePath,
                options: {
                    checkQuality: true,
                    checkSecurity: true,
                    checkPerformance: true,
                    checkMaintainability: true,
                    ...options
                }
            };
            // Send request to Lucidity MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'analyze-file', request);
            if (!response) {
                throw new Error('Invalid response from Lucidity MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to analyze file with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze a project
     */
    async analyzeProject(projectPath, options = {}) {
        try {
            logger_1.logger.debug(`Analyzing project ${projectPath} with Lucidity (${this.serverId})`);
            // Create request
            const request = {
                projectPath,
                options: {
                    checkQuality: true,
                    checkSecurity: true,
                    checkPerformance: true,
                    checkMaintainability: true,
                    ...options
                }
            };
            // Send request to Lucidity MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'analyze-project', request);
            if (!response) {
                throw new Error('Invalid response from Lucidity MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to analyze project with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get code metrics
     */
    async getCodeMetrics(code, language) {
        try {
            logger_1.logger.debug(`Getting metrics for ${language} code with Lucidity (${this.serverId})`);
            // Create request
            const request = {
                code,
                language
            };
            // Send request to Lucidity MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'metrics', request);
            if (!response) {
                throw new Error('Invalid response from Lucidity MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get code metrics with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Visualize code
     */
    async visualizeCode(code, language, visualizationType) {
        try {
            logger_1.logger.debug(`Visualizing ${language} code with Lucidity (${this.serverId})`);
            // Create request
            const request = {
                code,
                language,
                visualizationType
            };
            // Send request to Lucidity MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'visualize', request);
            if (!response) {
                throw new Error('Invalid response from Lucidity MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to visualize code with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.LucidityMCPAdapter = LucidityMCPAdapter;
