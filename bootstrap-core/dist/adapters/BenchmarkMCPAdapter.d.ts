/**
 * Benchmark MCP Adapter
 *
 * Adapter for the Benchmark MCP server.
 */
import { NexusClient } from '../core/NexusClient';
export interface BenchmarkOptions {
    language?: string;
    timeout?: number;
    maxAttempts?: number;
    passAtK?: number[];
    domain?: string;
    numRuns?: number;
    [key: string]: any;
}
export declare class BenchmarkMCPAdapter {
    private nexusClient;
    private serverId;
    constructor(nexusClient: NexusClient, serverId: string);
    /**
     * Get the server ID
     */
    getServerId(): string;
    /**
     * Run a benchmark
     */
    runBenchmark(benchmarkType: string, agentId: string, options?: BenchmarkOptions): Promise<any>;
    /**
     * Run HumanEval benchmark
     */
    runHumanEvalBenchmark(agentId: string, options?: BenchmarkOptions): Promise<any>;
    /**
     * Run τ-Bench benchmark
     */
    runTauBenchBenchmark(agentId: string, options?: BenchmarkOptions): Promise<any>;
    /**
     * Generate a solution for a problem
     */
    generateSolution(agentId: string, prompt: string, language: string, options?: any): Promise<string>;
    /**
     * Get benchmark results
     */
    getBenchmarkResults(benchmarkId: string): Promise<any>;
    /**
     * Compare benchmark results
     */
    compareBenchmarkResults(benchmarkIds: string[]): Promise<any>;
    /**
     * Get available benchmarks
     */
    getAvailableBenchmarks(): Promise<string[]>;
}
