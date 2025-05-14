"use strict";
/**
 * Model Manager
 *
 * Manages models for the continuous learning agent.
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
exports.ModelManager = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ModelManager {
    constructor(storagePath, adapterManager) {
        this.models = new Map();
        this.datasets = new Map();
        this.agentModels = new Map();
        this.storagePath = storagePath;
        this.adapterManager = adapterManager;
    }
    /**
     * Initialize the model manager
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing model manager...');
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
            bootstrap_core_1.logger.info('Model manager initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize model manager: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get a model by ID
     */
    async getModel(modelId) {
        return this.models.get(modelId) || null;
    }
    /**
     * Get all models
     */
    async getModels() {
        return Array.from(this.models.values());
    }
    /**
     * Get models for an agent
     */
    async getModelsForAgent(agentId) {
        const modelIds = this.agentModels.get(agentId) || [];
        const models = [];
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
    async getBaseModelForAgent(agentId) {
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
    async createModel(name, parameters = {}) {
        try {
            // Generate ID
            const id = this.generateId('model');
            // Create model
            const model = {
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
                this.agentModels.get(parameters.agentId).push(id);
            }
            bootstrap_core_1.logger.info(`Created model ${id}: ${name}`);
            return id;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create a dataset
     */
    async createDataset(examples, name, metadata = {}) {
        try {
            // Generate ID
            const id = this.generateId('dataset');
            // Create dataset
            const dataset = {
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
            bootstrap_core_1.logger.info(`Created dataset ${id}: ${name} with ${examples.length} examples`);
            return id;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create dataset: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get a dataset by ID
     */
    async getDataset(datasetId) {
        return this.datasets.get(datasetId) || null;
    }
    /**
     * Create an ensemble model
     */
    async createEnsembleModel(models, name, config = {}) {
        try {
            // Generate ID
            const id = this.generateId('model');
            // Create model
            const model = {
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
            bootstrap_core_1.logger.info(`Created ensemble model ${id}: ${name} with ${models.length} models`);
            return id;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create ensemble model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Evaluate a model on a dataset
     */
    async evaluateModel(model, dataset, config = {}) {
        bootstrap_core_1.logger.info(`Evaluating model ${model.id} on dataset ${dataset.id}...`);
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
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to evaluate model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Load models from storage
     */
    async loadModels() {
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
                        const model = JSON.parse(content);
                        this.models.set(model.id, model);
                        // Update agent models map
                        if (model.parameters?.agentId) {
                            if (!this.agentModels.has(model.parameters.agentId)) {
                                this.agentModels.set(model.parameters.agentId, []);
                            }
                            this.agentModels.get(model.parameters.agentId).push(model.id);
                        }
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse model file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.models.size} models from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load models: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Load datasets from storage
     */
    async loadDatasets() {
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
                        const dataset = JSON.parse(content);
                        this.datasets.set(dataset.id, dataset);
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse dataset file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.datasets.size} datasets from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load datasets: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save model to storage
     */
    async saveModel(model) {
        try {
            const modelsDir = path.join(this.storagePath, 'models');
            const filePath = path.join(modelsDir, `${model.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save model: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save dataset to storage
     */
    async saveDataset(dataset) {
        try {
            const datasetsDir = path.join(this.storagePath, 'datasets');
            const filePath = path.join(datasetsDir, `${dataset.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save dataset: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Initialize base models
     */
    async initializeBaseModels() {
        bootstrap_core_1.logger.info('Initializing base models...');
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
            bootstrap_core_1.logger.info('Base models initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize base models: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate a unique ID
     */
    generateId(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}_${timestamp}_${random}`;
    }
}
exports.ModelManager = ModelManager;
