/**
 * Learning Engine
 * 
 * Manages the learning process for agents, including fine-tuning models
 * and knowledge distillation.
 */

import { AdapterManager, logger } from 'bootstrap-core';
import { FeedbackManager } from '../feedback/FeedbackManager';
import { ModelManager } from '../models/ModelManager';
import { FineTuningPipeline } from './FineTuningPipeline';
import { KnowledgeDistillation } from './KnowledgeDistillation';

export interface LearningConfig {
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  validationSplit?: number;
  maxExamples?: number;
  [key: string]: any;
}

export interface LearningResult {
  agentId: string;
  modelId: string;
  metrics: {
    loss: number;
    accuracy: number;
    [key: string]: any;
  };
  timestamp: string;
}

export class LearningEngine {
  private feedbackManager: FeedbackManager;
  private modelManager: ModelManager;
  private adapterManager: AdapterManager;
  private fineTuningPipeline: FineTuningPipeline;
  private knowledgeDistillation: KnowledgeDistillation;
  
  constructor(
    feedbackManager: FeedbackManager,
    modelManager: ModelManager,
    adapterManager: AdapterManager
  ) {
    this.feedbackManager = feedbackManager;
    this.modelManager = modelManager;
    this.adapterManager = adapterManager;
    this.fineTuningPipeline = new FineTuningPipeline(modelManager, adapterManager);
    this.knowledgeDistillation = new KnowledgeDistillation(modelManager, adapterManager);
  }
  
  /**
   * Initialize the learning engine
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing learning engine...');
    
    try {
      // Initialize fine-tuning pipeline
      await this.fineTuningPipeline.initialize();
      
      // Initialize knowledge distillation
      await this.knowledgeDistillation.initialize();
      
      logger.info('Learning engine initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize learning engine: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Learn from feedback for an agent
   */
  public async learnFromFeedback(agentId: string, config: LearningConfig = {}): Promise<LearningResult> {
    logger.info(`Learning from feedback for agent ${agentId}...`);
    
    try {
      // Generate learning data from feedback
      const learningData = await this.feedbackManager.generateLearningData(agentId);
      
      // Check if we have enough examples
      if (learningData.examples.length === 0) {
        throw new Error(`No learning examples available for agent ${agentId}`);
      }
      
      // Get the base model for the agent
      const baseModel = await this.modelManager.getBaseModelForAgent(agentId);
      
      if (!baseModel) {
        throw new Error(`No base model found for agent ${agentId}`);
      }
      
      // Fine-tune the model
      const fineTuningResult = await this.fineTuningPipeline.fineTuneModel(
        baseModel.id,
        learningData,
        config
      );
      
      // Return the learning result
      return {
        agentId,
        modelId: fineTuningResult.modelId,
        metrics: fineTuningResult.metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to learn from feedback for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Distill knowledge from a teacher model to a student model
   */
  public async distillKnowledge(
    teacherModelId: string,
    studentModelId: string,
    config: any = {}
  ): Promise<any> {
    logger.info(`Distilling knowledge from model ${teacherModelId} to model ${studentModelId}...`);
    
    try {
      // Get the teacher model
      const teacherModel = await this.modelManager.getModel(teacherModelId);
      
      if (!teacherModel) {
        throw new Error(`Teacher model ${teacherModelId} not found`);
      }
      
      // Get the student model
      const studentModel = await this.modelManager.getModel(studentModelId);
      
      if (!studentModel) {
        throw new Error(`Student model ${studentModelId} not found`);
      }
      
      // Distill knowledge
      const distillationResult = await this.knowledgeDistillation.distillKnowledge(
        teacherModel,
        studentModel,
        config
      );
      
      return distillationResult;
    } catch (error) {
      logger.error(`Failed to distill knowledge: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new model by combining multiple models
   */
  public async createEnsembleModel(
    modelIds: string[],
    name: string,
    config: any = {}
  ): Promise<any> {
    logger.info(`Creating ensemble model from ${modelIds.length} models...`);
    
    try {
      // Get the models
      const models = [];
      
      for (const modelId of modelIds) {
        const model = await this.modelManager.getModel(modelId);
        
        if (!model) {
          throw new Error(`Model ${modelId} not found`);
        }
        
        models.push(model);
      }
      
      // Create ensemble model
      const ensembleModel = await this.modelManager.createEnsembleModel(
        models,
        name,
        config
      );
      
      return ensembleModel;
    } catch (error) {
      logger.error(`Failed to create ensemble model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Evaluate a model on a dataset
   */
  public async evaluateModel(
    modelId: string,
    datasetId: string,
    config: any = {}
  ): Promise<any> {
    logger.info(`Evaluating model ${modelId} on dataset ${datasetId}...`);
    
    try {
      // Get the model
      const model = await this.modelManager.getModel(modelId);
      
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      // Get the dataset
      const dataset = await this.modelManager.getDataset(datasetId);
      
      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }
      
      // Evaluate the model
      const evaluationResult = await this.modelManager.evaluateModel(
        model,
        dataset,
        config
      );
      
      return evaluationResult;
    } catch (error) {
      logger.error(`Failed to evaluate model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
