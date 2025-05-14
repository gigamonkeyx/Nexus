"use strict";
/**
 * Benchmark-Driven Improvement
 *
 * Implements a workflow for improving agents based on benchmark results.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkDrivenImprovement = void 0;
const bootstrap_core_1 = require("bootstrap-core");
class BenchmarkDrivenImprovement {
    constructor(feedbackManager, modelManager, learningEngine) {
        this.feedbackManager = feedbackManager;
        this.modelManager = modelManager;
        this.learningEngine = learningEngine;
    }
    /**
     * Process benchmark results
     */
    async processBenchmarkResults(benchmarkResult) {
        bootstrap_core_1.logger.info(`Processing benchmark results for agent ${benchmarkResult.agentId}`);
        try {
            // Add benchmark results as feedback
            await this.feedbackManager.addBenchmarkResults(benchmarkResult);
            // Analyze benchmark results
            const recommendations = await this.analyzeBenchmarkResults(benchmarkResult);
            // Store recommendations
            for (const recommendation of recommendations) {
                await this.storeRecommendation(recommendation);
            }
            // Update agent performance history
            await this.updateAgentPerformanceHistory(benchmarkResult);
            return recommendations;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to process benchmark results: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze benchmark results
     */
    async analyzeBenchmarkResults(benchmarkResult) {
        bootstrap_core_1.logger.debug(`Analyzing benchmark results for agent ${benchmarkResult.agentId}`);
        try {
            const recommendations = [];
            // Get previous benchmark results for comparison
            const previousResults = await this.getPreviousBenchmarkResults(benchmarkResult.agentId, benchmarkResult.benchmarkType);
            // Analyze based on benchmark type
            switch (benchmarkResult.benchmarkType) {
                case 'humaneval':
                    recommendations.push(...await this.analyzeHumanEvalResults(benchmarkResult, previousResults));
                    break;
                case 'taubench':
                    recommendations.push(...await this.analyzeTauBenchResults(benchmarkResult, previousResults));
                    break;
                default:
                    recommendations.push(...await this.analyzeGenericResults(benchmarkResult, previousResults));
                    break;
            }
            return recommendations;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to analyze benchmark results: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze HumanEval benchmark results
     */
    async analyzeHumanEvalResults(benchmarkResult, previousResults) {
        const recommendations = [];
        // Extract metrics
        const metrics = benchmarkResult.metrics;
        const passAtK = metrics.pass_at_k || {};
        const errorRate = metrics.error_rate || 0;
        // Check for low pass@k scores
        if (passAtK.pass_at_1 < 0.5) {
            recommendations.push({
                id: `rec_${Date.now()}_1`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'code_generation_accuracy',
                description: 'Low pass@1 score indicates issues with generating correct code on the first attempt',
                priority: 'high',
                implementationSuggestion: 'Fine-tune the model with more code examples and improve prompt engineering',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Check for high error rate
        if (errorRate > 0.3) {
            recommendations.push({
                id: `rec_${Date.now()}_2`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'error_handling',
                description: 'High error rate indicates issues with syntax or runtime errors in generated code',
                priority: 'high',
                implementationSuggestion: 'Improve error handling and add code validation before execution',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Check for specific problem patterns
        if (benchmarkResult.details && benchmarkResult.details.problems) {
            const problems = benchmarkResult.details.problems;
            const failedProblems = problems.filter((p) => !p.passed);
            if (failedProblems.length > 0) {
                // Group failed problems by error type
                const errorGroups = {};
                for (const problem of failedProblems) {
                    const errorType = this.categorizeError(problem.error || '');
                    if (!errorGroups[errorType]) {
                        errorGroups[errorType] = [];
                    }
                    errorGroups[errorType].push(problem.name);
                }
                // Create recommendations for each error group
                for (const [errorType, problemNames] of Object.entries(errorGroups)) {
                    if (problemNames.length >= 3) {
                        recommendations.push({
                            id: `rec_${Date.now()}_${errorType}`,
                            agentId: benchmarkResult.agentId,
                            benchmarkId: benchmarkResult.id,
                            area: `code_${errorType.toLowerCase()}`,
                            description: `Multiple problems failed with ${errorType} errors: ${problemNames.slice(0, 3).join(', ')}${problemNames.length > 3 ? ` and ${problemNames.length - 3} more` : ''}`,
                            priority: 'medium',
                            implementationSuggestion: `Improve ${errorType.toLowerCase()} handling in code generation`,
                            status: 'pending',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }
        return recommendations;
    }
    /**
     * Analyze τ-Bench benchmark results
     */
    async analyzeTauBenchResults(benchmarkResult, previousResults) {
        const recommendations = [];
        // Extract metrics
        const metrics = benchmarkResult.metrics;
        const reasoningScore = metrics.reasoning_score || 0;
        const planningScore = metrics.planning_score || 0;
        const adaptationScore = metrics.adaptation_score || 0;
        // Check for low reasoning score
        if (reasoningScore < 0.6) {
            recommendations.push({
                id: `rec_${Date.now()}_1`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'reasoning',
                description: 'Low reasoning score indicates issues with logical reasoning and problem-solving',
                priority: 'high',
                implementationSuggestion: 'Improve reasoning capabilities through fine-tuning with reasoning tasks',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Check for low planning score
        if (planningScore < 0.6) {
            recommendations.push({
                id: `rec_${Date.now()}_2`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'planning',
                description: 'Low planning score indicates issues with creating and following plans',
                priority: 'high',
                implementationSuggestion: 'Enhance planning capabilities with better plan generation and execution',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Check for low adaptation score
        if (adaptationScore < 0.6) {
            recommendations.push({
                id: `rec_${Date.now()}_3`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'adaptation',
                description: 'Low adaptation score indicates issues with adapting to changing requirements',
                priority: 'high',
                implementationSuggestion: 'Improve adaptation capabilities through dynamic planning and feedback loops',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Check for specific scenario patterns
        if (benchmarkResult.details && benchmarkResult.details.scenarios) {
            const scenarios = benchmarkResult.details.scenarios;
            const lowScoringScenarios = scenarios.filter((s) => s.overall_score < 0.5);
            if (lowScoringScenarios.length > 0) {
                // Group scenarios by lowest score area
                const areaGroups = {
                    reasoning: [],
                    planning: [],
                    adaptation: []
                };
                for (const scenario of lowScoringScenarios) {
                    const scores = {
                        reasoning: scenario.reasoning_score,
                        planning: scenario.planning_score,
                        adaptation: scenario.adaptation_score
                    };
                    const lowestArea = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)[0];
                    areaGroups[lowestArea].push(scenario.name);
                }
                // Create recommendations for each area group
                for (const [area, scenarioNames] of Object.entries(areaGroups)) {
                    if (scenarioNames.length >= 2) {
                        recommendations.push({
                            id: `rec_${Date.now()}_${area}`,
                            agentId: benchmarkResult.agentId,
                            benchmarkId: benchmarkResult.id,
                            area,
                            description: `Multiple scenarios show weakness in ${area}: ${scenarioNames.slice(0, 2).join(', ')}${scenarioNames.length > 2 ? ` and ${scenarioNames.length - 2} more` : ''}`,
                            priority: 'medium',
                            implementationSuggestion: `Improve ${area} capabilities through targeted training`,
                            status: 'pending',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }
        return recommendations;
    }
    /**
     * Analyze generic benchmark results
     */
    async analyzeGenericResults(benchmarkResult, previousResults) {
        const recommendations = [];
        // Check overall score
        if (benchmarkResult.score < 0.6) {
            recommendations.push({
                id: `rec_${Date.now()}_1`,
                agentId: benchmarkResult.agentId,
                benchmarkId: benchmarkResult.id,
                area: 'overall_performance',
                description: `Low overall score (${benchmarkResult.score.toFixed(2)}) in ${benchmarkResult.benchmarkType} benchmark`,
                priority: 'high',
                implementationSuggestion: 'Conduct detailed analysis and targeted improvements based on benchmark details',
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        }
        // Compare with previous results
        if (previousResults.length > 0) {
            const latestPrevious = previousResults[0];
            if (benchmarkResult.score < latestPrevious.score) {
                recommendations.push({
                    id: `rec_${Date.now()}_2`,
                    agentId: benchmarkResult.agentId,
                    benchmarkId: benchmarkResult.id,
                    area: 'regression',
                    description: `Performance regression detected: score decreased from ${latestPrevious.score.toFixed(2)} to ${benchmarkResult.score.toFixed(2)}`,
                    priority: 'critical',
                    implementationSuggestion: 'Investigate recent changes and revert problematic modifications',
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });
            }
        }
        return recommendations;
    }
    /**
     * Get previous benchmark results
     */
    async getPreviousBenchmarkResults(agentId, benchmarkType) {
        // Get benchmark results from feedback manager
        const results = this.feedbackManager.getBenchmarkResultsForAgent(agentId)
            .filter(result => result.benchmarkType === benchmarkType)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return results;
    }
    /**
     * Store recommendation
     */
    async storeRecommendation(recommendation) {
        // This is a placeholder implementation
        // In a real implementation, we would store the recommendation in a database
        bootstrap_core_1.logger.debug(`Storing recommendation: ${recommendation.id}`);
    }
    /**
     * Update agent performance history
     */
    async updateAgentPerformanceHistory(benchmarkResult) {
        // This is a placeholder implementation
        // In a real implementation, we would update the agent's performance history in a database
        bootstrap_core_1.logger.debug(`Updating performance history for agent ${benchmarkResult.agentId}`);
    }
    /**
     * Categorize error
     */
    categorizeError(error) {
        if (error.includes('syntax') || error.includes('SyntaxError')) {
            return 'Syntax';
        }
        else if (error.includes('type') || error.includes('TypeError')) {
            return 'Type';
        }
        else if (error.includes('reference') || error.includes('ReferenceError')) {
            return 'Reference';
        }
        else if (error.includes('logic') || error.includes('LogicError')) {
            return 'Logic';
        }
        else if (error.includes('runtime') || error.includes('RuntimeError')) {
            return 'Runtime';
        }
        else if (error.includes('memory') || error.includes('MemoryError')) {
            return 'Memory';
        }
        else if (error.includes('timeout') || error.includes('TimeoutError')) {
            return 'Timeout';
        }
        else {
            return 'Unknown';
        }
    }
}
exports.BenchmarkDrivenImprovement = BenchmarkDrivenImprovement;
