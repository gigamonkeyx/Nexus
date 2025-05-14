/**
 * Feedback Manager
 * 
 * Manages feedback for agents, including collection, storage, and processing.
 */

import { logger } from 'bootstrap-core';
import * as fs from 'fs';
import * as path from 'path';
import { FeedbackProcessor } from './FeedbackProcessor';
import { FeedbackAnalyzer } from './FeedbackAnalyzer';

export interface Feedback {
  id: string;
  agentId: string;
  source: 'user' | 'benchmark' | 'agent' | 'system';
  type: 'positive' | 'negative' | 'neutral' | 'suggestion';
  content: string;
  context?: {
    task?: string;
    input?: string;
    output?: string;
    timestamp?: string;
    [key: string]: any;
  };
  metadata?: {
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface BenchmarkResult {
  agentId: string;
  benchmarkType: string;
  score: number;
  metrics: Record<string, any>;
  details: any;
  timestamp: string;
}

export class FeedbackManager {
  private storagePath: string;
  private feedbacks: Map<string, Feedback> = new Map();
  private benchmarkResults: Map<string, BenchmarkResult> = new Map();
  private feedbackProcessor: FeedbackProcessor;
  private feedbackAnalyzer: FeedbackAnalyzer;
  
  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.feedbackProcessor = new FeedbackProcessor();
    this.feedbackAnalyzer = new FeedbackAnalyzer();
  }
  
  /**
   * Initialize the feedback manager
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing feedback manager...');
    
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
      
      logger.info('Feedback manager initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize feedback manager: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add feedback
   */
  public async addFeedback(feedback: Omit<Feedback, 'id' | 'timestamp'>): Promise<string> {
    try {
      // Generate ID and timestamp
      const id = this.generateId();
      const timestamp = new Date().toISOString();
      
      // Create full feedback object
      const fullFeedback: Feedback = {
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
      
      logger.info(`Added feedback ${id} for agent ${feedback.agentId}`);
      
      return id;
    } catch (error) {
      logger.error(`Failed to add feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add benchmark results as feedback
   */
  public async addBenchmarkResults(result: BenchmarkResult): Promise<void> {
    try {
      // Store benchmark result
      this.benchmarkResults.set(`${result.agentId}_${result.benchmarkType}_${result.timestamp}`, result);
      
      // Save to file
      await this.saveBenchmarkResult(result);
      
      // Convert to feedback
      const feedback: Omit<Feedback, 'id' | 'timestamp'> = {
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
      
      logger.info(`Added benchmark result for agent ${result.agentId} as feedback`);
    } catch (error) {
      logger.error(`Failed to add benchmark result: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get feedback for an agent
   */
  public getFeedbackForAgent(agentId: string): Feedback[] {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.agentId === agentId);
  }
  
  /**
   * Get all feedback
   */
  public getAllFeedback(): Feedback[] {
    return Array.from(this.feedbacks.values());
  }
  
  /**
   * Get benchmark results for an agent
   */
  public getBenchmarkResultsForAgent(agentId: string): BenchmarkResult[] {
    return Array.from(this.benchmarkResults.values())
      .filter(result => result.agentId === agentId);
  }
  
  /**
   * Get all benchmark results
   */
  public getAllBenchmarkResults(): BenchmarkResult[] {
    return Array.from(this.benchmarkResults.values());
  }
  
  /**
   * Analyze feedback for an agent
   */
  public async analyzeFeedbackForAgent(agentId: string): Promise<any> {
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
    } catch (error) {
      logger.error(`Failed to analyze feedback for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate learning data from feedback
   */
  public async generateLearningData(agentId: string): Promise<any> {
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
    } catch (error) {
      logger.error(`Failed to generate learning data for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Load feedback from storage
   */
  private async loadFeedback(): Promise<void> {
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
            const feedback = JSON.parse(content) as Feedback;
            this.feedbacks.set(feedback.id, feedback);
          } catch (error) {
            logger.warn(`Failed to parse feedback file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      logger.info(`Loaded ${this.feedbacks.size} feedback items from storage`);
    } catch (error) {
      logger.error(`Failed to load feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Load benchmark results from storage
   */
  private async loadBenchmarkResults(): Promise<void> {
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
            const result = JSON.parse(content) as BenchmarkResult;
            this.benchmarkResults.set(`${result.agentId}_${result.benchmarkType}_${result.timestamp}`, result);
          } catch (error) {
            logger.warn(`Failed to parse benchmark result file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      logger.info(`Loaded ${this.benchmarkResults.size} benchmark results from storage`);
    } catch (error) {
      logger.error(`Failed to load benchmark results: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Save feedback to storage
   */
  private async saveFeedback(feedback: Feedback): Promise<void> {
    try {
      const feedbackDir = path.join(this.storagePath, 'feedback');
      const filePath = path.join(feedbackDir, `${feedback.id}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(feedback, null, 2));
    } catch (error) {
      logger.error(`Failed to save feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Save benchmark result to storage
   */
  private async saveBenchmarkResult(result: BenchmarkResult): Promise<void> {
    try {
      const benchmarkDir = path.join(this.storagePath, 'benchmarks');
      const filePath = path.join(benchmarkDir, `${result.agentId}_${result.benchmarkType}_${result.timestamp.replace(/:/g, '-')}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    } catch (error) {
      logger.error(`Failed to save benchmark result: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Process feedback
   */
  private async processFeedback(feedback: Feedback): Promise<void> {
    try {
      // Process feedback
      await this.feedbackProcessor.processFeedback(feedback);
    } catch (error) {
      logger.error(`Failed to process feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `feedback_${timestamp}_${random}`;
  }
}
