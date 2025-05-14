/**
 * Adapter Manager
 *
 * Manages adapters for different MCP servers.
 */
import { NexusClient } from '../core/NexusClient';
import { OllamaMCPAdapter } from './OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from './CodeEnhancementMCPAdapter';
import { LucidityMCPAdapter } from './LucidityMCPAdapter';
import { BenchmarkMCPAdapter } from './BenchmarkMCPAdapter';
export declare class AdapterManager {
    private nexusClient;
    private ollamaAdapters;
    private codeEnhancementAdapters;
    private lucidityAdapters;
    private benchmarkAdapters;
    constructor(nexusClient: NexusClient);
    /**
     * Initialize adapters
     */
    private initializeAdapters;
    /**
     * Get the first Ollama MCP adapter
     */
    getFirstOllamaMCPAdapter(): OllamaMCPAdapter | undefined;
    /**
     * Get all Ollama MCP adapters
     */
    getOllamaMCPAdapters(): OllamaMCPAdapter[];
    /**
     * Get the first CodeEnhancement adapter
     */
    getFirstCodeEnhancementAdapter(): CodeEnhancementMCPAdapter | undefined;
    /**
     * Get all CodeEnhancement adapters
     */
    getCodeEnhancementAdapters(): CodeEnhancementMCPAdapter[];
    /**
     * Get the first Lucidity adapter
     */
    getFirstLucidityAdapter(): LucidityMCPAdapter | undefined;
    /**
     * Get all Lucidity adapters
     */
    getLucidityAdapters(): LucidityMCPAdapter[];
    /**
     * Get the first Benchmark adapter
     */
    getFirstBenchmarkAdapter(): BenchmarkMCPAdapter | undefined;
    /**
     * Get all Benchmark adapters
     */
    getBenchmarkAdapters(): BenchmarkMCPAdapter[];
    /**
     * Add an Ollama adapter
     */
    addOllamaAdapter(adapter: OllamaMCPAdapter): void;
    /**
     * Add a CodeEnhancement adapter
     */
    addCodeEnhancementAdapter(adapter: CodeEnhancementMCPAdapter): void;
    /**
     * Add a Lucidity adapter
     */
    addLucidityAdapter(adapter: LucidityMCPAdapter): void;
    /**
     * Add a Benchmark adapter
     */
    addBenchmarkAdapter(adapter: BenchmarkMCPAdapter): void;
    /**
     * Remove an Ollama adapter
     */
    removeOllamaAdapter(serverId: string): void;
    /**
     * Remove a CodeEnhancement adapter
     */
    removeCodeEnhancementAdapter(serverId: string): void;
    /**
     * Remove a Lucidity adapter
     */
    removeLucidityAdapter(serverId: string): void;
    /**
     * Remove a Benchmark adapter
     */
    removeBenchmarkAdapter(serverId: string): void;
}
