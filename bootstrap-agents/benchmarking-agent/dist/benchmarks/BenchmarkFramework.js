"use strict";
/**
 * Benchmark Framework
 *
 * Orchestrates the benchmarking process for evaluating agents.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkFramework = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const HumanEvalBenchmark_1 = require("./HumanEvalBenchmark");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class BenchmarkFramework {
    constructor(adapterManager, agentCommunication) {
        this.tauBenchInfo = null;
        this.benchmarks = new Map();
        this.adapterManager = adapterManager;
        this.ollamaAdapter = adapterManager.getFirstOllamaMCPAdapter();
        this.benchmarkAdapter = adapterManager.getFirstBenchmarkAdapter();
        this.agentCommunication = agentCommunication;
        // Initialize benchmarks
        this.humanEvalBenchmark = new HumanEvalBenchmark_1.HumanEvalBenchmark(adapterManager);
    }
    /**
     * Initialize the benchmark framework
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing benchmark framework...');
        try {
            // Initialize benchmarks
            await this.humanEvalBenchmark.initialize();
            // Register benchmarks
            this.registerBenchmark('humaneval', this.humanEvalBenchmark);
            bootstrap_core_1.logger.info('Benchmark framework initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize benchmark framework: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Register a benchmark
     */
    registerBenchmark(name, benchmark) {
        this.benchmarks.set(name, benchmark);
        bootstrap_core_1.logger.info(`Registered benchmark: ${name}`);
    }
    /**
     * Set τ-Bench information
     */
    setTauBenchInfo(info) {
        this.tauBenchInfo = info;
        bootstrap_core_1.logger.info('τ-Bench information set');
        // Try to load τ-Bench adapter
        this.loadTauBenchAdapter();
    }
    /**
     * Load τ-Bench adapter
     */
    async loadTauBenchAdapter() {
        if (!this.tauBenchInfo || !this.tauBenchInfo.outputDir) {
            bootstrap_core_1.logger.warn('Cannot load τ-Bench adapter: No τ-Bench information available');
            return;
        }
        try {
            const tauBenchDir = this.tauBenchInfo.outputDir;
            // Check if τ-Bench adapter exists
            if (fs.existsSync(path.join(tauBenchDir, 'TauBenchAdapter.ts'))) {
                bootstrap_core_1.logger.info('Found τ-Bench adapter, attempting to load...');
                // In a real implementation, we would dynamically load the adapter
                // For now, we'll just register it as available
                this.registerBenchmark('taubench', {
                    name: 'τ-Bench',
                    description: 'Benchmark for evaluating agents in dynamic real-world settings',
                    components: this.tauBenchInfo.components,
                    outputDir: tauBenchDir,
                    runBenchmark: async (agentId, options) => {
                        // This is a placeholder for the actual implementation
                        bootstrap_core_1.logger.info(`Running τ-Bench benchmark for agent ${agentId}`);
                        return {
                            agentId,
                            benchmarkType: 'taubench',
                            score: 0.75,
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
                bootstrap_core_1.logger.info('τ-Bench adapter registered successfully');
            }
            else {
                bootstrap_core_1.logger.warn(`τ-Bench adapter not found at ${tauBenchDir}`);
            }
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load τ-Bench adapter: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Run a benchmark
     */
    async runBenchmark(agentId, benchmarkType, options = {}) {
        bootstrap_core_1.logger.info(`Running ${benchmarkType} benchmark for agent ${agentId}`);
        try {
            // Check if benchmark exists
            if (!this.benchmarks.has(benchmarkType)) {
                throw new Error(`Unknown benchmark type: ${benchmarkType}`);
            }
            const benchmark = this.benchmarks.get(benchmarkType);
            // Run benchmark
            let result;
            if (benchmarkType === 'humaneval') {
                result = await this.humanEvalBenchmark.runBenchmark(agentId, options);
            }
            else {
                // For other benchmarks, use the runBenchmark method
                result = await benchmark.runBenchmark(agentId, options);
            }
            // Log result
            bootstrap_core_1.logger.info(`Benchmark ${benchmarkType} completed for agent ${agentId} with score ${result.score}`);
            // Send result to Continuous Learning Agent
            await this.sendBenchmarkResultToContinuousLearningAgent(result);
            return result;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to run benchmark ${benchmarkType} for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Run multiple benchmarks
     */
    async runMultipleBenchmarks(agentId, benchmarkTypes, options = {}) {
        bootstrap_core_1.logger.info(`Running multiple benchmarks for agent ${agentId}: ${benchmarkTypes.join(', ')}`);
        const results = [];
        for (const benchmarkType of benchmarkTypes) {
            try {
                const result = await this.runBenchmark(agentId, benchmarkType, options);
                results.push(result);
            }
            catch (error) {
                bootstrap_core_1.logger.error(`Failed to run benchmark ${benchmarkType}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    }
    /**
     * Compare agents on a benchmark
     */
    async compareAgents(agentIds, benchmarkType, options = {}) {
        bootstrap_core_1.logger.info(`Comparing agents on ${benchmarkType} benchmark: ${agentIds.join(', ')}`);
        const results = {};
        for (const agentId of agentIds) {
            try {
                const result = await this.runBenchmark(agentId, benchmarkType, options);
                results[agentId] = result;
            }
            catch (error) {
                bootstrap_core_1.logger.error(`Failed to run benchmark for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    }
    /**
     * Generate a benchmark report
     */
    generateReport(results) {
        bootstrap_core_1.logger.info('Generating benchmark report');
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
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
            return `Error generating report: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    /**
     * Save a benchmark report to a file
     */
    saveReport(report, filePath) {
        bootstrap_core_1.logger.info(`Saving benchmark report to ${filePath}`);
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Write report to file
            fs.writeFileSync(filePath, report);
            bootstrap_core_1.logger.info(`Report saved to ${filePath}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save report: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Send benchmark result to Continuous Learning Agent
     */
    async sendBenchmarkResultToContinuousLearningAgent(result) {
        bootstrap_core_1.logger.info(`Sending benchmark result to Continuous Learning Agent for agent ${result.agentId}`);
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
                bootstrap_core_1.logger.info(`Benchmark result for agent ${result.agentId} sent to Continuous Learning Agent`);
            }
            else {
                bootstrap_core_1.logger.warn(`Cannot send benchmark result to Continuous Learning Agent: AgentCommunication not available`);
            }
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to send benchmark result to Continuous Learning Agent: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.BenchmarkFramework = BenchmarkFramework;
