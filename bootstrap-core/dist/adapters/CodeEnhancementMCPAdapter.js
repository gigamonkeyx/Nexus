"use strict";
/**
 * Code Enhancement MCP Adapter
 *
 * Adapter for the Code Enhancement MCP server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEnhancementMCPAdapter = void 0;
const logger_1 = require("../utils/logger");
class CodeEnhancementMCPAdapter {
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
     * Enhance code
     */
    async enhanceCode(code, language, options = {}) {
        try {
            logger_1.logger.debug(`Enhancing ${language} code with CodeEnhancement (${this.serverId})`);
            // Create request
            const request = {
                code,
                language,
                options: {
                    addDocumentation: true,
                    addErrorHandling: true,
                    addLogging: true,
                    improveReadability: true,
                    ...options
                }
            };
            // Send request to CodeEnhancement MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'enhance', request);
            if (!response || !response.enhancedCode) {
                throw new Error('Invalid response from CodeEnhancement MCP server');
            }
            return response.enhancedCode;
        }
        catch (error) {
            logger_1.logger.error(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Format code
     */
    async formatCode(code, language) {
        try {
            logger_1.logger.debug(`Formatting ${language} code with CodeEnhancement (${this.serverId})`);
            // Create request
            const request = {
                code,
                language
            };
            // Send request to CodeEnhancement MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'format', request);
            if (!response || !response.formattedCode) {
                throw new Error('Invalid response from CodeEnhancement MCP server');
            }
            return response.formattedCode;
        }
        catch (error) {
            logger_1.logger.error(`Failed to format code: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Refactor code
     */
    async refactorCode(code, language, refactoringType, options = {}) {
        try {
            logger_1.logger.debug(`Refactoring ${language} code with CodeEnhancement (${this.serverId})`);
            // Create request
            const request = {
                code,
                language,
                refactoringType,
                options
            };
            // Send request to CodeEnhancement MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'refactor', request);
            if (!response || !response.refactoredCode) {
                throw new Error('Invalid response from CodeEnhancement MCP server');
            }
            return response.refactoredCode;
        }
        catch (error) {
            logger_1.logger.error(`Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate tests for code
     */
    async generateTests(code, language, options = {}) {
        try {
            logger_1.logger.debug(`Generating tests for ${language} code with CodeEnhancement (${this.serverId})`);
            // Create request
            const request = {
                code,
                language,
                options
            };
            // Send request to CodeEnhancement MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'generate-tests', request);
            if (!response || !response.tests) {
                throw new Error('Invalid response from CodeEnhancement MCP server');
            }
            return response.tests;
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.CodeEnhancementMCPAdapter = CodeEnhancementMCPAdapter;
