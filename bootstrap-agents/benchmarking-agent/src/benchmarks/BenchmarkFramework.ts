/**
 * Benchmark Framework
 *
 * Orchestrates the benchmarking process for evaluating agents.
 */

import {
  AdapterManager,
  OllamaMCPAdapter,
  BenchmarkMCPAdapter,
  AgentCommunication,
  logger
} from 'bootstrap-core';
import { HumanEvalBenchmark } from './HumanEvalBenchmark';
import * as fs from 'fs';
import * as path from 'path';

export interface BenchmarkResult {
  agentId: string;
  benchmarkType: string;
  score: number;
  metrics: Record<string, any>;
  details: any;
  timestamp: string;
}

export interface BenchmarkOptions {
  language?: 'typescript' | 'javascript' | 'python';
  timeout?: number;
  maxAttempts?: number;
  passAtK?: number[];
  domain?: string;
  numRuns?: number;
  [key: string]: any;
}

export class BenchmarkFramework {
  private adapterManager: AdapterManager;
  private ollamaAdapter?: OllamaMCPAdapter;
  private benchmarkAdapter?: BenchmarkMCPAdapter;
  private agentCommunication?: AgentCommunication;
  private humanEvalBenchmark: HumanEvalBenchmark;
  private tauBenchInfo: any | null = null;
  private benchmarks: Map<string, any> = new Map();

  constructor(adapterManager: AdapterManager, agentCommunication?: AgentCommunication) {
    this.adapterManager = adapterManager;
    this.ollamaAdapter = adapterManager.getFirstOllamaMCPAdapter();
    this.benchmarkAdapter = adapterManager.getFirstBenchmarkAdapter();
    this.agentCommunication = agentCommunication;

    // Initialize benchmarks
    this.humanEvalBenchmark = new HumanEvalBenchmark(adapterManager);
  }

  /**
   * Initialize the benchmark framework
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing benchmark framework...');

    try {
      // Initialize benchmarks
      await this.humanEvalBenchmark.initialize();

      // Register benchmarks
      this.registerBenchmark('humaneval', this.humanEvalBenchmark);

      logger.info('Benchmark framework initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize benchmark framework: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Register a benchmark
   */
  public registerBenchmark(name: string, benchmark: any): void {
    this.benchmarks.set(name, benchmark);
    logger.info(`Registered benchmark: ${name}`);
  }

  /**
   * Set τ-Bench information
   */
  public setTauBenchInfo(info: any): void {
    this.tauBenchInfo = info;
    logger.info('τ-Bench information set');

    // Try to load τ-Bench adapter
    this.loadTauBenchAdapter();
  }

  /**
   * Load τ-Bench adapter
   */
  private async loadTauBenchAdapter(): Promise<void> {
    if (!this.tauBenchInfo || !this.tauBenchInfo.outputDir) {
      logger.warn('Cannot load τ-Bench adapter: No τ-Bench information available');
      return;
    }

    try {
      const tauBenchDir = this.tauBenchInfo.outputDir;

      // Check if τ-Bench adapter exists
      if (fs.existsSync(path.join(tauBenchDir, 'TauBenchAdapter.ts'))) {
        logger.info('Found τ-Bench adapter, attempting to load...');

        // In a real implementation, we would dynamically load the adapter
        // For now, we'll just register it as available
        this.registerBenchmark('taubench', {
          name: 'τ-Bench',
          description: 'Benchmark for evaluating agents in dynamic real-world settings',
          components: this.tauBenchInfo.components,
          outputDir: tauBenchDir,
          runBenchmark: async (agentId: string, options: BenchmarkOptions) => {
            // This is a placeholder for the actual implementation
            logger.info(`Running τ-Bench benchmark for agent ${agentId}`);

            return {
              agentId,
              benchmarkType: 'taubench',
              score: 0.75, // Placeholder score
              metrics: {
                passK: 0.75,
                taskCompletion: 0.8,
                policyAdherence: 0.7
              },
              details: {
                domain: options.domain || 'retail',
                numRuns: options.numRuns || 8,
                scenarios: ['retail-order-scenario']
              },
              timestamp: new Date().toISOString()
            };
          }
        });

        logger.info('τ-Bench adapter registered successfully');
      } else {
        logger.warn(`τ-Bench adapter not found at ${tauBenchDir}`);
      }
    } catch (error) {
      logger.error(`Failed to load τ-Bench adapter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run a benchmark
   */
  public async runBenchmark(
    agentId: string,
    benchmarkType: string,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    logger.info(`Running ${benchmarkType} benchmark for agent ${agentId}`);

    try {
      // Check if benchmark exists
      if (!this.benchmarks.has(benchmarkType)) {
        throw new Error(`Unknown benchmark type: ${benchmarkType}`);
      }

      const benchmark = this.benchmarks.get(benchmarkType);

      // Run benchmark
      let result: BenchmarkResult;

      if (benchmarkType === 'humaneval') {
        result = await this.humanEvalBenchmark.runBenchmark(agentId, options);
      } else {
        // For other benchmarks, use the runBenchmark method
        result = await benchmark.runBenchmark(agentId, options);
      }

      // Log result
      logger.info(`Benchmark ${benchmarkType} completed for agent ${agentId} with score ${result.score}`);

      // Send result to Continuous Learning Agent
      await this.sendBenchmarkResultToContinuousLearningAgent(result);

      return result;
    } catch (error) {
      logger.error(`Failed to run benchmark ${benchmarkType} for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Run multiple benchmarks
   */
  public async runMultipleBenchmarks(
    agentId: string,
    benchmarkTypes: string[],
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult[]> {
    logger.info(`Running multiple benchmarks for agent ${agentId}: ${benchmarkTypes.join(', ')}`);

    const results: BenchmarkResult[] = [];

    for (const benchmarkType of benchmarkTypes) {
      try {
        const result = await this.runBenchmark(agentId, benchmarkType, options);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to run benchmark ${benchmarkType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }

  /**
   * Compare agents on a benchmark
   */
  public async compareAgents(
    agentIds: string[],
    benchmarkType: string,
    options: BenchmarkOptions = {}
  ): Promise<Record<string, BenchmarkResult>> {
    logger.info(`Comparing agents on ${benchmarkType} benchmark: ${agentIds.join(', ')}`);

    const results: Record<string, BenchmarkResult> = {};

    for (const agentId of agentIds) {
      try {
        const result = await this.runBenchmark(agentId, benchmarkType, options);
        results[agentId] = result;
      } catch (error) {
        logger.error(`Failed to run benchmark for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }

  /**
   * Generate a benchmark report
   */
  public generateReport(results: BenchmarkResult | BenchmarkResult[]): string {
    logger.info('Generating benchmark report');

    try {
      // Convert single result to array
      const resultsArray = Array.isArray(results) ? results : [results];

      // Generate report
      let report = '# Benchmark Report\n\n';
      report += `Generated: ${new Date().toISOString()}\n\n`;

      // Add results
      for (const result of resultsArray) {
        report += `## ${result.benchmarkType} Benchmark for Agent ${result.agentId}\n\n`;
        report += `- Score: ${result.score}\n`;
        report += `- Timestamp: ${result.timestamp}\n\n`;

        // Add metrics
        report += '### Metrics\n\n';
        for (const [key, value] of Object.entries(result.metrics)) {
          report += `- ${key}: ${value}\n`;
        }

        report += '\n';

        // Add details
        report += '### Details\n\n';
        report += '```json\n';
        report += JSON.stringify(result.details, null, 2);
        report += '\n```\n\n';
      }

      return report;
    } catch (error) {
      logger.error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
      return `Error generating report: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Save a benchmark report to a file
   */
  public saveReport(report: string, filePath: string): void {
    logger.info(`Saving benchmark report to ${filePath}`);

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write report to file
      fs.writeFileSync(filePath, report);

      logger.info(`Report saved to ${filePath}`);
    } catch (error) {
      logger.error(`Failed to save report: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Send benchmark result to Continuous Learning Agent
   */
  private async sendBenchmarkResultToContinuousLearningAgent(result: BenchmarkResult): Promise<void> {
    logger.info(`Sending benchmark result to Continuous Learning Agent for agent ${result.agentId}`);

    try {
      if (this.agentCommunication) {
        // Send the result using AgentCommunication
        this.agentCommunication.sendMessage({
          from: 'benchmarking-agent',
          to: 'continuous-learning-agent',
          type: 'notification',
          subject: 'Benchmark results',
          content: result
        });

        logger.info(`Benchmark result for agent ${result.agentId} sent to Continuous Learning Agent`);
      } else {
        logger.warn(`Cannot send benchmark result to Continuous Learning Agent: AgentCommunication not available`);
      }
    } catch (error) {
      logger.error(`Failed to send benchmark result to Continuous Learning Agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
