/**
 * Benchmark MCP Adapter
 * 
 * Adapter for the Benchmark MCP server.
 */

import { NexusClient } from '../core/NexusClient';
import { logger } from '../utils/logger';

export interface BenchmarkOptions {
  language?: string;
  timeout?: number;
  maxAttempts?: number;
  passAtK?: number[];
  domain?: string;
  numRuns?: number;
  [key: string]: any;
}

export class BenchmarkMCPAdapter {
  private nexusClient: NexusClient;
  private serverId: string;
  
  constructor(nexusClient: NexusClient, serverId: string) {
    this.nexusClient = nexusClient;
    this.serverId = serverId;
  }
  
  /**
   * Get the server ID
   */
  public getServerId(): string {
    return this.serverId;
  }
  
  /**
   * Run a benchmark
   */
  public async runBenchmark(
    benchmarkType: string,
    agentId: string,
    options: BenchmarkOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Running ${benchmarkType} benchmark for agent ${agentId} with Benchmark (${this.serverId})`);
      
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
    } catch (error) {
      logger.error(`Failed to run benchmark: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Run HumanEval benchmark
   */
  public async runHumanEvalBenchmark(
    agentId: string,
    options: BenchmarkOptions = {}
  ): Promise<any> {
    return this.runBenchmark('humaneval', agentId, options);
  }
  
  /**
   * Run τ-Bench benchmark
   */
  public async runTauBenchBenchmark(
    agentId: string,
    options: BenchmarkOptions = {}
  ): Promise<any> {
    return this.runBenchmark('taubench', agentId, options);
  }
  
  /**
   * Generate a solution for a problem
   */
  public async generateSolution(
    agentId: string,
    prompt: string,
    language: string,
    options: any = {}
  ): Promise<string> {
    try {
      logger.debug(`Generating solution for agent ${agentId} with Benchmark (${this.serverId})`);
      
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
    } catch (error) {
      logger.error(`Failed to generate solution: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get benchmark results
   */
  public async getBenchmarkResults(
    benchmarkId: string
  ): Promise<any> {
    try {
      logger.debug(`Getting benchmark results for ${benchmarkId} with Benchmark (${this.serverId})`);
      
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
    } catch (error) {
      logger.error(`Failed to get benchmark results: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Compare benchmark results
   */
  public async compareBenchmarkResults(
    benchmarkIds: string[]
  ): Promise<any> {
    try {
      logger.debug(`Comparing benchmark results for ${benchmarkIds.join(', ')} with Benchmark (${this.serverId})`);
      
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
    } catch (error) {
      logger.error(`Failed to compare benchmark results: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get available benchmarks
   */
  public async getAvailableBenchmarks(): Promise<string[]> {
    try {
      logger.debug(`Getting available benchmarks with Benchmark (${this.serverId})`);
      
      // Send request to Benchmark MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'get-available-benchmarks', {});
      
      if (!response || !response.benchmarks || !Array.isArray(response.benchmarks)) {
        throw new Error('Invalid response from Benchmark MCP server');
      }
      
      return response.benchmarks;
    } catch (error) {
      logger.error(`Failed to get available benchmarks: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
