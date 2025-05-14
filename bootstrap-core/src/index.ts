/**
 * Bootstrap Core Module
 *
 * Core functionality for the bootstrapping approach to building the AI Agent Factory.
 */

// Export all core components
export * from './communication/AgentCommunication';
export * from './tasks/TaskManager';
export * from './utils/logger';
export * from './adapters/AdapterManager';
export * from './adapters/OllamaMCPAdapter';
export * from './adapters/CodeEnhancementMCPAdapter';
export * from './adapters/LucidityMCPAdapter';
export * from './adapters/BenchmarkMCPAdapter';
export * from './core/NexusClient';
export * from './core/EventBus';
export * from './core/ErrorHandling';
export * from './types/AgentTypes';
export * from './types/MessageTypes';
export * from './types/TaskTypes';
export * from './types/BenchmarkTypes';
