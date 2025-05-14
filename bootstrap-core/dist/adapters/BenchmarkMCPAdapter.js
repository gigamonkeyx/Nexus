"use strict";
/**
 * Benchmark MCP Adapter
 *
 * Adapter for the Benchmark MCP server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkMCPAdapter = void 0;
const logger_1 = require("../utils/logger");
class BenchmarkMCPAdapter {
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
     * Run a benchmark
     */
    async runBenchmark(benchmarkType, agentId, options = {}) {
        try {
            logger_1.logger.debug(`Running ${benchmarkType} benchmark for agent ${agentId} with Benchmark (${this.serverId})`);
            // Create request
            const request = {
                benchmarkType,
                agentId,
                options
            };
            // Send request to Benchmark MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'run-benchmark', request);
            if (!response) {
                throw new Error('Invalid response from Benchmark MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to run benchmark: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Run HumanEval benchmark
     */
    async runHumanEvalBenchmark(agentId, options = {}) {
        return this.runBenchmark('humaneval', agentId, options);
    }
    /**
     * Run τ-Bench benchmark
     */
    async runTauBenchBenchmark(agentId, options = {}) {
        return this.runBenchmark('taubench', agentId, options);
    }
    /**
     * Generate a solution for a problem
     */
    async generateSolution(agentId, prompt, language, options = {}) {
        try {
            logger_1.logger.debug(`Generating solution for agent ${agentId} with Benchmark (${this.serverId})`);
            // Create request
            const request = {
                agentId,
                prompt,
                language,
                options
            };
            // Send request to Benchmark MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'generate-solution', request);
            if (!response || !response.solution) {
                throw new Error('Invalid response from Benchmark MCP server');
            }
            return response.solution;
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate solution: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get benchmark results
     */
    async getBenchmarkResults(benchmarkId) {
        try {
            logger_1.logger.debug(`Getting benchmark results for ${benchmarkId} with Benchmark (${this.serverId})`);
            // Create request
            const request = {
                benchmarkId
            };
            // Send request to Benchmark MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'get-results', request);
            if (!response) {
                throw new Error('Invalid response from Benchmark MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get benchmark results: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Compare benchmark results
     */
    async compareBenchmarkResults(benchmarkIds) {
        try {
            logger_1.logger.debug(`Comparing benchmark results for ${benchmarkIds.join(', ')} with Benchmark (${this.serverId})`);
            // Create request
            const request = {
                benchmarkIds
            };
            // Send request to Benchmark MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'compare-results', request);
            if (!response) {
                throw new Error('Invalid response from Benchmark MCP server');
            }
            return response;
        }
        catch (error) {
            logger_1.logger.error(`Failed to compare benchmark results: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get available benchmarks
     */
    async getAvailableBenchmarks() {
        try {
            logger_1.logger.debug(`Getting available benchmarks with Benchmark (${this.serverId})`);
            // Send request to Benchmark MCP server
            const response = await this.nexusClient.sendRequest(this.serverId, 'get-available-benchmarks', {});
            if (!response || !response.benchmarks || !Array.isArray(response.benchmarks)) {
                throw new Error('Invalid response from Benchmark MCP server');
            }
            return response.benchmarks;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get available benchmarks: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.BenchmarkMCPAdapter = BenchmarkMCPAdapter;
