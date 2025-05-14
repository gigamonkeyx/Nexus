"use strict";
/**
 * Feedback Manager
 *
 * Manages feedback for agents, including collection, storage, and processing.
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
exports.FeedbackManager = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const FeedbackProcessor_1 = require("./FeedbackProcessor");
const FeedbackAnalyzer_1 = require("./FeedbackAnalyzer");
class FeedbackManager {
    constructor(storagePath) {
        this.feedbacks = new Map();
        this.benchmarkResults = new Map();
        this.storagePath = storagePath;
        this.feedbackProcessor = new FeedbackProcessor_1.FeedbackProcessor();
        this.feedbackAnalyzer = new FeedbackAnalyzer_1.FeedbackAnalyzer();
    }
    /**
     * Initialize the feedback manager
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing feedback manager...');
        try {
            // Ensure storage directory exists
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }
            // Create subdirectories
            const feedbackDir = path.join(this.storagePath, 'feedback');
            const benchmarkDir = path.join(this.storagePath, 'benchmarks');
            const analysisDir = path.join(this.storagePath, 'analysis');
            if (!fs.existsSync(feedbackDir)) {
                fs.mkdirSync(feedbackDir, { recursive: true });
            }
            if (!fs.existsSync(benchmarkDir)) {
                fs.mkdirSync(benchmarkDir, { recursive: true });
            }
            if (!fs.existsSync(analysisDir)) {
                fs.mkdirSync(analysisDir, { recursive: true });
            }
            // Load existing feedback
            await this.loadFeedback();
            // Load existing benchmark results
            await this.loadBenchmarkResults();
            bootstrap_core_1.logger.info('Feedback manager initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize feedback manager: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Add feedback
     */
    async addFeedback(feedback) {
        try {
            // Generate ID and timestamp
            const id = this.generateId();
            const timestamp = new Date().toISOString();
            // Create full feedback object
            const fullFeedback = {
                ...feedback,
                id,
                timestamp
            };
            // Store feedback
            this.feedbacks.set(id, fullFeedback);
            // Save to file
            await this.saveFeedback(fullFeedback);
            // Process feedback
            await this.processFeedback(fullFeedback);
            bootstrap_core_1.logger.info(`Added feedback ${id} for agent ${feedback.agentId}`);
            return id;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to add feedback: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Add benchmark results as feedback
     */
    async addBenchmarkResults(result) {
        try {
            // Store benchmark result
            this.benchmarkResults.set(`${result.agentId}_${result.benchmarkType}_${result.timestamp}`, result);
            // Save to file
            await this.saveBenchmarkResult(result);
            // Convert to feedback
            const feedback = {
                agentId: result.agentId,
                source: 'benchmark',
                type: result.score >= 0.7 ? 'positive' : result.score >= 0.4 ? 'neutral' : 'negative',
                content: `Benchmark ${result.benchmarkType} score: ${result.score}`,
                context: {
                    benchmarkType: result.benchmarkType,
                    score: result.score,
                    metrics: result.metrics,
                    details: result.details,
                    timestamp: result.timestamp
                },
                metadata: {
                    tags: ['benchmark', result.benchmarkType],
                    category: 'performance'
                }
            };
            // Add as feedback
            await this.addFeedback(feedback);
            bootstrap_core_1.logger.info(`Added benchmark result for agent ${result.agentId} as feedback`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to add benchmark result: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get feedback for an agent
     */
    getFeedbackForAgent(agentId) {
        return Array.from(this.feedbacks.values())
            .filter(feedback => feedback.agentId === agentId);
    }
    /**
     * Get all feedback
     */
    getAllFeedback() {
        return Array.from(this.feedbacks.values());
    }
    /**
     * Get benchmark results for an agent
     */
    getBenchmarkResultsForAgent(agentId) {
        return Array.from(this.benchmarkResults.values())
            .filter(result => result.agentId === agentId);
    }
    /**
     * Get all benchmark results
     */
    getAllBenchmarkResults() {
        return Array.from(this.benchmarkResults.values());
    }
    /**
     * Analyze feedback for an agent
     */
    async analyzeFeedbackForAgent(agentId) {
        try {
            const feedback = this.getFeedbackForAgent(agentId);
            if (feedback.length === 0) {
                return {
                    agentId,
                    feedbackCount: 0,
                    analysis: 'No feedback available for analysis'
                };
            }
            // Analyze feedback
            const analysis = await this.feedbackAnalyzer.analyzeFeedback(feedback);
            // Save analysis
            const analysisPath = path.join(this.storagePath, 'analysis', `${agentId}_${Date.now()}.json`);
            fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
            return analysis;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to analyze feedback for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate learning data from feedback
     */
    async generateLearningData(agentId) {
        try {
            const feedback = this.getFeedbackForAgent(agentId);
            if (feedback.length === 0) {
                return {
                    agentId,
                    feedbackCount: 0,
                    learningData: 'No feedback available for generating learning data'
                };
            }
            // Generate learning data
            const learningData = await this.feedbackProcessor.generateLearningData(feedback);
            // Save learning data
            const learningDataPath = path.join(this.storagePath, 'learning', `${agentId}_${Date.now()}.json`);
            // Ensure learning directory exists
            const learningDir = path.join(this.storagePath, 'learning');
            if (!fs.existsSync(learningDir)) {
                fs.mkdirSync(learningDir, { recursive: true });
            }
            fs.writeFileSync(learningDataPath, JSON.stringify(learningData, null, 2));
            return learningData;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to generate learning data for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Load feedback from storage
     */
    async loadFeedback() {
        try {
            const feedbackDir = path.join(this.storagePath, 'feedback');
            if (!fs.existsSync(feedbackDir)) {
                return;
            }
            const files = fs.readdirSync(feedbackDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(feedbackDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    try {
                        const feedback = JSON.parse(content);
                        this.feedbacks.set(feedback.id, feedback);
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse feedback file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.feedbacks.size} feedback items from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load feedback: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Load benchmark results from storage
     */
    async loadBenchmarkResults() {
        try {
            const benchmarkDir = path.join(this.storagePath, 'benchmarks');
            if (!fs.existsSync(benchmarkDir)) {
                return;
            }
            const files = fs.readdirSync(benchmarkDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(benchmarkDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    try {
                        const result = JSON.parse(content);
                        this.benchmarkResults.set(`${result.agentId}_${result.benchmarkType}_${result.timestamp}`, result);
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse benchmark result file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.benchmarkResults.size} benchmark results from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load benchmark results: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save feedback to storage
     */
    async saveFeedback(feedback) {
        try {
            const feedbackDir = path.join(this.storagePath, 'feedback');
            const filePath = path.join(feedbackDir, `${feedback.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(feedback, null, 2));
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save feedback: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save benchmark result to storage
     */
    async saveBenchmarkResult(result) {
        try {
            const benchmarkDir = path.join(this.storagePath, 'benchmarks');
            const filePath = path.join(benchmarkDir, `${result.agentId}_${result.benchmarkType}_${result.timestamp.replace(/:/g, '-')}.json`);
            fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save benchmark result: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Process feedback
     */
    async processFeedback(feedback) {
        try {
            // Process feedback
            await this.feedbackProcessor.processFeedback(feedback);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to process feedback: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate a unique ID
     */
    generateId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `feedback_${timestamp}_${random}`;
    }
}
exports.FeedbackManager = FeedbackManager;
