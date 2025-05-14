/**
 * Model Manager
 * 
 * Manages models for the continuous learning agent.
 */

import { AdapterManager, logger } from 'bootstrap-core';
import * as fs from 'fs';
import * as path from 'path';

export interface Model {
  id: string;
  name: string;
  type: 'base' | 'fine-tuned' | 'distilled' | 'ensemble';
  baseModelId?: string;
  metadata?: {
    size?: number;
    parameters?: number;
    architecture?: string;
    [key: string]: any;
  };
  parameters?: any;
  timestamp: string;
}

export interface Dataset {
  id: string;
  name: string;
  examples: any[];
  metadata?: any;
  timestamp: string;
}

export class ModelManager {
  private storagePath: string;
  private adapterManager: AdapterManager;
  private models: Map<string, Model> = new Map();
  private datasets: Map<string, Dataset> = new Map();
  private agentModels: Map<string, string[]> = new Map();
  
  constructor(storagePath: string, adapterManager: AdapterManager) {
    this.storagePath = storagePath;
    this.adapterManager = adapterManager;
  }
  
  /**
   * Initialize the model manager
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing model manager...');
    
    try {
      // Ensure storage directory exists
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
      
      // Create subdirectories
      const modelsDir = path.join(this.storagePath, 'models');
      const datasetsDir = path.join(this.storagePath, 'datasets');
      
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      
      if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
      }
      
      // Load existing models
      await this.loadModels();
      
      // Load existing datasets
      await this.loadDatasets();
      
      // Initialize base models if none exist
      if (this.models.size === 0) {
        await this.initializeBaseModels();
      }
      
      logger.info('Model manager initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize model manager: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a model by ID
   */
  public async getModel(modelId: string): Promise<Model | null> {
    return this.models.get(modelId) || null;
  }
  
  /**
   * Get all models
   */
  public async getModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }
  
  /**
   * Get models for an agent
   */
  public async getModelsForAgent(agentId: string): Promise<Model[]> {
    const modelIds = this.agentModels.get(agentId) || [];
    const models: Model[] = [];
    
    for (const modelId of modelIds) {
      const model = this.models.get(modelId);
      
      if (model) {
        models.push(model);
      }
    }
    
    return models;
  }
  
  /**
   * Get the base model for an agent
   */
  public async getBaseModelForAgent(agentId: string): Promise<Model | null> {
    const models = await this.getModelsForAgent(agentId);
    
    // Find the base model
    const baseModel = models.find(model => model.type === 'base');
    
    if (baseModel) {
      return baseModel;
    }
    
    // If no base model found, use the default base model
    const defaultBaseModel = Array.from(this.models.values())
      .find(model => model.type === 'base' && model.name === 'llama3');
    
    return defaultBaseModel || null;
  }
  
  /**
   * Create a new model
   */
  public async createModel(
    name: string,
    parameters: any = {}
  ): Promise<string> {
    try {
      // Generate ID
      const id = this.generateId('model');
      
      // Create model
      const model: Model = {
        id,
        name,
        type: parameters.type || 'base',
        baseModelId: parameters.baseModelId,
        metadata: parameters.metadata || {},
        parameters,
        timestamp: new Date().toISOString()
      };
      
      // Store model
      this.models.set(id, model);
      
      // Save to file
      await this.saveModel(model);
      
      // Associate with agent if provided
      if (parameters.agentId) {
        if (!this.agentModels.has(parameters.agentId)) {
          this.agentModels.set(parameters.agentId, []);
        }
        
        this.agentModels.get(parameters.agentId)!.push(id);
      }
      
      logger.info(`Created model ${id}: ${name}`);
      
      return id;
    } catch (error) {
      logger.error(`Failed to create model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a dataset
   */
  public async createDataset(
    examples: any[],
    name: string,
    metadata: any = {}
  ): Promise<string> {
    try {
      // Generate ID
      const id = this.generateId('dataset');
      
      // Create dataset
      const dataset: Dataset = {
        id,
        name,
        examples,
        metadata,
        timestamp: new Date().toISOString()
      };
      
      // Store dataset
      this.datasets.set(id, dataset);
      
      // Save to file
      await this.saveDataset(dataset);
      
      logger.info(`Created dataset ${id}: ${name} with ${examples.length} examples`);
      
      return id;
    } catch (error) {
      logger.error(`Failed to create dataset: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a dataset by ID
   */
  public async getDataset(datasetId: string): Promise<Dataset | null> {
    return this.datasets.get(datasetId) || null;
  }
  
  /**
   * Create an ensemble model
   */
  public async createEnsembleModel(
    models: Model[],
    name: string,
    config: any = {}
  ): Promise<string> {
    try {
      // Generate ID
      const id = this.generateId('model');
      
      // Create model
      const model: Model = {
        id,
        name,
        type: 'ensemble',
        metadata: {
          models: models.map(m => m.id),
          ...config
        },
        parameters: {
          models: models.map(m => m.id),
          ...config
        },
        timestamp: new Date().toISOString()
      };
      
      // Store model
      this.models.set(id, model);
      
      // Save to file
      await this.saveModel(model);
      
      logger.info(`Created ensemble model ${id}: ${name} with ${models.length} models`);
      
      return id;
    } catch (error) {
      logger.error(`Failed to create ensemble model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Evaluate a model on a dataset
   */
  public async evaluateModel(
    model: Model,
    dataset: Dataset,
    config: any = {}
  ): Promise<any> {
    logger.info(`Evaluating model ${model.id} on dataset ${dataset.id}...`);
    
    try {
      // Get Ollama adapter
      const ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
      
      if (!ollamaAdapter) {
        throw new Error('No Ollama adapter available for model evaluation');
      }
      
      // This is a placeholder for the actual evaluation process
      // In a real implementation, we would use the Ollama adapter to evaluate the model
      
      // Return evaluation results
      return {
        modelId: model.id,
        datasetId: dataset.id,
        metrics: {
          loss: 0.2,
          accuracy: 0.85,
          precision: 0.8,
          recall: 0.75,
          f1: 0.77
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to evaluate model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Load models from storage
   */
  private async loadModels(): Promise<void> {
    try {
      const modelsDir = path.join(this.storagePath, 'models');
      
      if (!fs.existsSync(modelsDir)) {
        return;
      }
      
      const files = fs.readdirSync(modelsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(modelsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          try {
            const model = JSON.parse(content) as Model;
            this.models.set(model.id, model);
            
            // Update agent models map
            if (model.parameters?.agentId) {
              if (!this.agentModels.has(model.parameters.agentId)) {
                this.agentModels.set(model.parameters.agentId, []);
              }
              
              this.agentModels.get(model.parameters.agentId)!.push(model.id);
            }
          } catch (error) {
            logger.warn(`Failed to parse model file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      logger.info(`Loaded ${this.models.size} models from storage`);
    } catch (error) {
      logger.error(`Failed to load models: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Load datasets from storage
   */
  private async loadDatasets(): Promise<void> {
    try {
      const datasetsDir = path.join(this.storagePath, 'datasets');
      
      if (!fs.existsSync(datasetsDir)) {
        return;
      }
      
      const files = fs.readdirSync(datasetsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(datasetsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          try {
            const dataset = JSON.parse(content) as Dataset;
            this.datasets.set(dataset.id, dataset);
          } catch (error) {
            logger.warn(`Failed to parse dataset file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      logger.info(`Loaded ${this.datasets.size} datasets from storage`);
    } catch (error) {
      logger.error(`Failed to load datasets: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Save model to storage
   */
  private async saveModel(model: Model): Promise<void> {
    try {
      const modelsDir = path.join(this.storagePath, 'models');
      const filePath = path.join(modelsDir, `${model.id}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
    } catch (error) {
      logger.error(`Failed to save model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Save dataset to storage
   */
  private async saveDataset(dataset: Dataset): Promise<void> {
    try {
      const datasetsDir = path.join(this.storagePath, 'datasets');
      const filePath = path.join(datasetsDir, `${dataset.id}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
    } catch (error) {
      logger.error(`Failed to save dataset: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Initialize base models
   */
  private async initializeBaseModels(): Promise<void> {
    logger.info('Initializing base models...');
    
    try {
      // Create base models
      await this.createModel('llama3', {
        type: 'base',
        metadata: {
          size: 8000,
          parameters: 8000000000,
          architecture: 'transformer',
          description: 'Llama 3 8B model'
        }
      });
      
      await this.createModel('codellama', {
        type: 'base',
        metadata: {
          size: 7000,
          parameters: 7000000000,
          architecture: 'transformer',
          description: 'CodeLlama 7B model'
        }
      });
      
      await this.createModel('mistral', {
        type: 'base',
        metadata: {
          size: 7000,
          parameters: 7000000000,
          architecture: 'transformer',
          description: 'Mistral 7B model'
        }
      });
      
      logger.info('Base models initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize base models: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `${prefix}_${timestamp}_${random}`;
  }
}
