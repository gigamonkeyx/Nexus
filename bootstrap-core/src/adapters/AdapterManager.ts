/**
 * Adapter Manager
 * 
 * Manages adapters for different MCP servers.
 */

import { NexusClient } from '../core/NexusClient';
import { logger } from '../utils/logger';
import { OllamaMCPAdapter } from './OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from './CodeEnhancementMCPAdapter';
import { LucidityMCPAdapter } from './LucidityMCPAdapter';
import { BenchmarkMCPAdapter } from './BenchmarkMCPAdapter';

export class AdapterManager {
  private nexusClient: NexusClient;
  private ollamaAdapters: OllamaMCPAdapter[] = [];
  private codeEnhancementAdapters: CodeEnhancementMCPAdapter[] = [];
  private lucidityAdapters: LucidityMCPAdapter[] = [];
  private benchmarkAdapters: BenchmarkMCPAdapter[] = [];
  
  constructor(nexusClient: NexusClient) {
    this.nexusClient = nexusClient;
    this.initializeAdapters();
  }
  
  /**
   * Initialize adapters
   */
  private initializeAdapters(): void {
    try {
      // Get connected servers
      const servers = this.nexusClient.getConnectedServers();
      
      for (const server of servers) {
        // Check server type
        if (server.includes('ollama')) {
          this.ollamaAdapters.push(new OllamaMCPAdapter(this.nexusClient, server));
          logger.info(`Created Ollama adapter for server: ${server}`);
        } else if (server.includes('code-enhancement')) {
          this.codeEnhancementAdapters.push(new CodeEnhancementMCPAdapter(this.nexusClient, server));
          logger.info(`Created CodeEnhancement adapter for server: ${server}`);
        } else if (server.includes('lucidity')) {
          this.lucidityAdapters.push(new LucidityMCPAdapter(this.nexusClient, server));
          logger.info(`Created Lucidity adapter for server: ${server}`);
        } else if (server.includes('benchmark')) {
          this.benchmarkAdapters.push(new BenchmarkMCPAdapter(this.nexusClient, server));
          logger.info(`Created Benchmark adapter for server: ${server}`);
        }
      }
      
      // Log adapter counts
      logger.info(`Initialized adapters: ${this.ollamaAdapters.length} Ollama, ${this.codeEnhancementAdapters.length} CodeEnhancement, ${this.lucidityAdapters.length} Lucidity, ${this.benchmarkAdapters.length} Benchmark`);
    } catch (error) {
      logger.error(`Failed to initialize adapters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the first Ollama MCP adapter
   */
  public getFirstOllamaMCPAdapter(): OllamaMCPAdapter | undefined {
    return this.ollamaAdapters[0];
  }
  
  /**
   * Get all Ollama MCP adapters
   */
  public getOllamaMCPAdapters(): OllamaMCPAdapter[] {
    return this.ollamaAdapters;
  }
  
  /**
   * Get the first CodeEnhancement adapter
   */
  public getFirstCodeEnhancementAdapter(): CodeEnhancementMCPAdapter | undefined {
    return this.codeEnhancementAdapters[0];
  }
  
  /**
   * Get all CodeEnhancement adapters
   */
  public getCodeEnhancementAdapters(): CodeEnhancementMCPAdapter[] {
    return this.codeEnhancementAdapters;
  }
  
  /**
   * Get the first Lucidity adapter
   */
  public getFirstLucidityAdapter(): LucidityMCPAdapter | undefined {
    return this.lucidityAdapters[0];
  }
  
  /**
   * Get all Lucidity adapters
   */
  public getLucidityAdapters(): LucidityMCPAdapter[] {
    return this.lucidityAdapters;
  }
  
  /**
   * Get the first Benchmark adapter
   */
  public getFirstBenchmarkAdapter(): BenchmarkMCPAdapter | undefined {
    return this.benchmarkAdapters[0];
  }
  
  /**
   * Get all Benchmark adapters
   */
  public getBenchmarkAdapters(): BenchmarkMCPAdapter[] {
    return this.benchmarkAdapters;
  }
  
  /**
   * Add an Ollama adapter
   */
  public addOllamaAdapter(adapter: OllamaMCPAdapter): void {
    this.ollamaAdapters.push(adapter);
    logger.info(`Added Ollama adapter: ${adapter.getServerId()}`);
  }
  
  /**
   * Add a CodeEnhancement adapter
   */
  public addCodeEnhancementAdapter(adapter: CodeEnhancementMCPAdapter): void {
    this.codeEnhancementAdapters.push(adapter);
    logger.info(`Added CodeEnhancement adapter: ${adapter.getServerId()}`);
  }
  
  /**
   * Add a Lucidity adapter
   */
  public addLucidityAdapter(adapter: LucidityMCPAdapter): void {
    this.lucidityAdapters.push(adapter);
    logger.info(`Added Lucidity adapter: ${adapter.getServerId()}`);
  }
  
  /**
   * Add a Benchmark adapter
   */
  public addBenchmarkAdapter(adapter: BenchmarkMCPAdapter): void {
    this.benchmarkAdapters.push(adapter);
    logger.info(`Added Benchmark adapter: ${adapter.getServerId()}`);
  }
  
  /**
   * Remove an Ollama adapter
   */
  public removeOllamaAdapter(serverId: string): void {
    this.ollamaAdapters = this.ollamaAdapters.filter(adapter => adapter.getServerId() !== serverId);
    logger.info(`Removed Ollama adapter: ${serverId}`);
  }
  
  /**
   * Remove a CodeEnhancement adapter
   */
  public removeCodeEnhancementAdapter(serverId: string): void {
    this.codeEnhancementAdapters = this.codeEnhancementAdapters.filter(adapter => adapter.getServerId() !== serverId);
    logger.info(`Removed CodeEnhancement adapter: ${serverId}`);
  }
  
  /**
   * Remove a Lucidity adapter
   */
  public removeLucidityAdapter(serverId: string): void {
    this.lucidityAdapters = this.lucidityAdapters.filter(adapter => adapter.getServerId() !== serverId);
    logger.info(`Removed Lucidity adapter: ${serverId}`);
  }
  
  /**
   * Remove a Benchmark adapter
   */
  public removeBenchmarkAdapter(serverId: string): void {
    this.benchmarkAdapters = this.benchmarkAdapters.filter(adapter => adapter.getServerId() !== serverId);
    logger.info(`Removed Benchmark adapter: ${serverId}`);
  }
}
