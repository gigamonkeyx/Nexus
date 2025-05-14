"use strict";
/**
 * Adapter Manager
 *
 * Manages adapters for different MCP servers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterManager = void 0;
const logger_1 = require("../utils/logger");
const OllamaMCPAdapter_1 = require("./OllamaMCPAdapter");
const CodeEnhancementMCPAdapter_1 = require("./CodeEnhancementMCPAdapter");
const LucidityMCPAdapter_1 = require("./LucidityMCPAdapter");
const BenchmarkMCPAdapter_1 = require("./BenchmarkMCPAdapter");
class AdapterManager {
    constructor(nexusClient) {
        this.ollamaAdapters = [];
        this.codeEnhancementAdapters = [];
        this.lucidityAdapters = [];
        this.benchmarkAdapters = [];
        this.nexusClient = nexusClient;
        this.initializeAdapters();
    }
    /**
     * Initialize adapters
     */
    initializeAdapters() {
        try {
            // Get connected servers
            const servers = this.nexusClient.getConnectedServers();
            for (const server of servers) {
                // Check server type
                if (server.includes('ollama')) {
                    this.ollamaAdapters.push(new OllamaMCPAdapter_1.OllamaMCPAdapter(this.nexusClient, server));
                    logger_1.logger.info(`Created Ollama adapter for server: ${server}`);
                }
                else if (server.includes('code-enhancement')) {
                    this.codeEnhancementAdapters.push(new CodeEnhancementMCPAdapter_1.CodeEnhancementMCPAdapter(this.nexusClient, server));
                    logger_1.logger.info(`Created CodeEnhancement adapter for server: ${server}`);
                }
                else if (server.includes('lucidity')) {
                    this.lucidityAdapters.push(new LucidityMCPAdapter_1.LucidityMCPAdapter(this.nexusClient, server));
                    logger_1.logger.info(`Created Lucidity adapter for server: ${server}`);
                }
                else if (server.includes('benchmark')) {
                    this.benchmarkAdapters.push(new BenchmarkMCPAdapter_1.BenchmarkMCPAdapter(this.nexusClient, server));
                    logger_1.logger.info(`Created Benchmark adapter for server: ${server}`);
                }
            }
            // Log adapter counts
            logger_1.logger.info(`Initialized adapters: ${this.ollamaAdapters.length} Ollama, ${this.codeEnhancementAdapters.length} CodeEnhancement, ${this.lucidityAdapters.length} Lucidity, ${this.benchmarkAdapters.length} Benchmark`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize adapters: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the first Ollama MCP adapter
     */
    getFirstOllamaMCPAdapter() {
        return this.ollamaAdapters[0];
    }
    /**
     * Get all Ollama MCP adapters
     */
    getOllamaMCPAdapters() {
        return this.ollamaAdapters;
    }
    /**
     * Get the first CodeEnhancement adapter
     */
    getFirstCodeEnhancementAdapter() {
        return this.codeEnhancementAdapters[0];
    }
    /**
     * Get all CodeEnhancement adapters
     */
    getCodeEnhancementAdapters() {
        return this.codeEnhancementAdapters;
    }
    /**
     * Get the first Lucidity adapter
     */
    getFirstLucidityAdapter() {
        return this.lucidityAdapters[0];
    }
    /**
     * Get all Lucidity adapters
     */
    getLucidityAdapters() {
        return this.lucidityAdapters;
    }
    /**
     * Get the first Benchmark adapter
     */
    getFirstBenchmarkAdapter() {
        return this.benchmarkAdapters[0];
    }
    /**
     * Get all Benchmark adapters
     */
    getBenchmarkAdapters() {
        return this.benchmarkAdapters;
    }
    /**
     * Add an Ollama adapter
     */
    addOllamaAdapter(adapter) {
        this.ollamaAdapters.push(adapter);
        logger_1.logger.info(`Added Ollama adapter: ${adapter.getServerId()}`);
    }
    /**
     * Add a CodeEnhancement adapter
     */
    addCodeEnhancementAdapter(adapter) {
        this.codeEnhancementAdapters.push(adapter);
        logger_1.logger.info(`Added CodeEnhancement adapter: ${adapter.getServerId()}`);
    }
    /**
     * Add a Lucidity adapter
     */
    addLucidityAdapter(adapter) {
        this.lucidityAdapters.push(adapter);
        logger_1.logger.info(`Added Lucidity adapter: ${adapter.getServerId()}`);
    }
    /**
     * Add a Benchmark adapter
     */
    addBenchmarkAdapter(adapter) {
        this.benchmarkAdapters.push(adapter);
        logger_1.logger.info(`Added Benchmark adapter: ${adapter.getServerId()}`);
    }
    /**
     * Remove an Ollama adapter
     */
    removeOllamaAdapter(serverId) {
        this.ollamaAdapters = this.ollamaAdapters.filter(adapter => adapter.getServerId() !== serverId);
        logger_1.logger.info(`Removed Ollama adapter: ${serverId}`);
    }
    /**
     * Remove a CodeEnhancement adapter
     */
    removeCodeEnhancementAdapter(serverId) {
        this.codeEnhancementAdapters = this.codeEnhancementAdapters.filter(adapter => adapter.getServerId() !== serverId);
        logger_1.logger.info(`Removed CodeEnhancement adapter: ${serverId}`);
    }
    /**
     * Remove a Lucidity adapter
     */
    removeLucidityAdapter(serverId) {
        this.lucidityAdapters = this.lucidityAdapters.filter(adapter => adapter.getServerId() !== serverId);
        logger_1.logger.info(`Removed Lucidity adapter: ${serverId}`);
    }
    /**
     * Remove a Benchmark adapter
     */
    removeBenchmarkAdapter(serverId) {
        this.benchmarkAdapters = this.benchmarkAdapters.filter(adapter => adapter.getServerId() !== serverId);
        logger_1.logger.info(`Removed Benchmark adapter: ${serverId}`);
    }
}
exports.AdapterManager = AdapterManager;
