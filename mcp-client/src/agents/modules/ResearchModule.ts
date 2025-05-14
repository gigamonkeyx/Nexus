/**
 * ResearchModule
 * 
 * Module for research capabilities.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { NexusClient } from '../../core/NexusClient';
import { logger } from '../../utils/logger';

/**
 * ResearchModule configuration
 */
export interface ResearchModuleConfig extends ModuleConfig {
  nexusClient: NexusClient;
  maxSearchResults?: number;
  maxWebFetchDepth?: number;
}

/**
 * ResearchModule provides research capabilities.
 */
export class ResearchModule extends BaseModule {
  private nexusClient: NexusClient;
  private maxSearchResults: number;
  private maxWebFetchDepth: number;
  private researchCache: Map<string, any> = new Map();

  /**
   * Creates a new ResearchModule instance.
   * @param config Module configuration
   */
  constructor(config: ResearchModuleConfig) {
    super(config);
    this.nexusClient = config.nexusClient;
    this.maxSearchResults = config.maxSearchResults || 5;
    this.maxWebFetchDepth = config.maxWebFetchDepth || 3;
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering research capabilities for agent: ${agent.getName()}`);

      // Register webSearch capability
      agent.registerCapability('webSearch', async (parameters: any) => {
        try {
          const { query, num_results } = parameters;
          return await this.nexusClient.callTool('web-search', {
            query,
            num_results: num_results || this.maxSearchResults
          });
        } catch (error) {
          logger.error(`Failed to perform web search: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register webFetch capability
      agent.registerCapability('webFetch', async (parameters: any) => {
        try {
          const { url } = parameters;
          return await this.nexusClient.callTool('web-fetch', { url });
        } catch (error) {
          logger.error(`Failed to fetch web content: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register research capability
      agent.registerCapability('research', async (parameters: any) => {
        try {
          const { topic, depth } = parameters;
          return await this.performResearch(topic, depth || this.maxWebFetchDepth);
        } catch (error) {
          logger.error(`Failed to perform research: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register saveResearch capability
      agent.registerCapability('saveResearch', async (parameters: any) => {
        try {
          const { topic, content, format } = parameters;
          return await this.saveResearch(topic, content, format);
        } catch (error) {
          logger.error(`Failed to save research: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register createKnowledgeGraph capability
      agent.registerCapability('createKnowledgeGraph', async (parameters: any) => {
        try {
          const { entities, relations } = parameters;
          
          // Create entities
          await this.nexusClient.callTool('create_entities_RaG_MCP', { entities });
          
          // Create relations
          if (relations && relations.length > 0) {
            await this.nexusClient.callTool('create_relations_RaG_MCP', { relations });
          }
          
          return { success: true, entities: entities.length, relations: relations ? relations.length : 0 };
        } catch (error) {
          logger.error(`Failed to create knowledge graph: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register searchKnowledgeGraph capability
      agent.registerCapability('searchKnowledgeGraph', async (parameters: any) => {
        try {
          const { query } = parameters;
          return await this.nexusClient.callTool('search_nodes_RaG_MCP', { query });
        } catch (error) {
          logger.error(`Failed to search knowledge graph: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Research capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      logger.error(`Failed to register research capabilities: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Performs research on a topic.
   * @param topic Topic to research
   * @param depth Maximum depth of research
   * @returns Research results
   */
  private async performResearch(topic: string, depth: number): Promise<any> {
    try {
      logger.info(`Performing research on topic: ${topic}`);

      // Check cache
      const cacheKey = `${topic}:${depth}`;
      if (this.researchCache.has(cacheKey)) {
        logger.info(`Using cached research for topic: ${topic}`);
        return this.researchCache.get(cacheKey);
      }

      // Perform web search
      const searchResults = await this.nexusClient.callTool('web-search', {
        query: topic,
        num_results: this.maxSearchResults
      });

      // Fetch content from search results
      const fetchResults = [];
      let currentDepth = 0;
      const visitedUrls = new Set<string>();

      // Start with the initial search results
      let urlsToVisit = searchResults.results.map((result: any) => result.url);

      while (currentDepth < depth && urlsToVisit.length > 0) {
        const nextUrlsToVisit: string[] = [];

        for (const url of urlsToVisit) {
          if (visitedUrls.has(url)) {
            continue;
          }

          try {
            // Fetch content
            const fetchResult = await this.nexusClient.callTool('web-fetch', { url });
            fetchResults.push({
              url,
              content: fetchResult.content,
              depth: currentDepth
            });

            // Mark as visited
            visitedUrls.add(url);

            // Extract links for next depth
            if (currentDepth < depth - 1) {
              const links = this.extractLinks(fetchResult.content, url);
              nextUrlsToVisit.push(...links);
            }
          } catch (error) {
            logger.error(`Failed to fetch content from ${url}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Move to next depth
        urlsToVisit = nextUrlsToVisit.filter(url => !visitedUrls.has(url)).slice(0, this.maxSearchResults);
        currentDepth++;
      }

      // Compile research results
      const researchResults = {
        topic,
        searchResults: searchResults.results,
        fetchResults,
        summary: this.summarizeResearch(fetchResults)
      };

      // Cache results
      this.researchCache.set(cacheKey, researchResults);

      return researchResults;
    } catch (error) {
      logger.error(`Failed to perform research: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Extracts links from HTML content.
   * @param content HTML content
   * @param baseUrl Base URL
   * @returns Array of links
   */
  private extractLinks(content: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      try {
        const href = match[1];
        
        // Skip anchors and javascript links
        if (href.startsWith('#') || href.startsWith('javascript:')) {
          continue;
        }
        
        // Resolve relative URLs
        const url = new URL(href, baseUrl).toString();
        links.push(url);
      } catch (error) {
        // Ignore invalid URLs
      }
    }

    return links;
  }

  /**
   * Summarizes research results.
   * @param fetchResults Fetch results
   * @returns Summary
   */
  private summarizeResearch(fetchResults: any[]): string {
    // In a real implementation, this would use an LLM to summarize the research
    return `Research summary based on ${fetchResults.length} sources.`;
  }

  /**
   * Saves research results.
   * @param topic Research topic
   * @param content Research content
   * @param format Output format
   * @returns Save status
   */
  private async saveResearch(topic: string, content: string, format: string = 'markdown'): Promise<any> {
    try {
      logger.info(`Saving research on topic: ${topic}`);

      // Sanitize topic for filename
      const sanitizedTopic = topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${sanitizedTopic}_${timestamp}`;

      // Format content
      let formattedContent = content;
      if (format === 'markdown') {
        formattedContent = `# Research: ${topic}\n\n${content}\n\n## Generated on ${new Date().toISOString()}`;
      } else if (format === 'html') {
        formattedContent = `<!DOCTYPE html>
<html>
<head>
  <title>Research: ${topic}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .timestamp { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Research: ${topic}</h1>
  ${content}
  <p class="timestamp">Generated on ${new Date().toISOString()}</p>
</body>
</html>`;
      }

      // Save file
      await this.nexusClient.callTool('save-file', {
        instructions_reminder: 'LIMIT THE FILE CONTENT TO AT MOST 300 LINES. IF MORE CONTENT NEEDS TO BE ADDED USE THE str-replace-editor TOOL TO EDIT THE FILE AFTER IT HAS BEEN CREATED.',
        file_path: `D:\\mcp\\nexus\\research\\${filename}.${format === 'html' ? 'html' : 'md'}`,
        file_content: formattedContent,
        add_last_line_newline: true
      });

      return {
        success: true,
        topic,
        filename: `${filename}.${format === 'html' ? 'html' : 'md'}`,
        format
      };
    } catch (error) {
      logger.error(`Failed to save research: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  async handleTask(task: string, agent: Agent): Promise<boolean> {
    // Check if the task is a research task
    const researchPatterns = [
      /research/i,
      /find information/i,
      /search for/i,
      /look up/i,
      /investigate/i,
      /gather information/i
    ];

    if (researchPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling research task: ${task}`);

        // Extract topic from task
        const topic = task.replace(/^(research|find information about|search for|look up|investigate|gather information about)/i, '').trim();

        // Perform research
        const result = await this.performResearch(topic, this.maxWebFetchDepth);

        // Add result to agent memory
        agent.addToMemory({
          role: 'assistant',
          content: `I've researched "${topic}" and found information from ${result.fetchResults.length} sources. Here's a summary: ${result.summary}`
        });

        return true;
      } catch (error) {
        logger.error(`Failed to handle research task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Gets the Nexus client.
   * @returns Nexus client
   */
  getNexusClient(): NexusClient {
    return this.nexusClient;
  }

  /**
   * Sets the Nexus client.
   * @param nexusClient Nexus client
   */
  setNexusClient(nexusClient: NexusClient): void {
    this.nexusClient = nexusClient;
  }

  /**
   * Gets the maximum number of search results.
   * @returns Maximum number of search results
   */
  getMaxSearchResults(): number {
    return this.maxSearchResults;
  }

  /**
   * Sets the maximum number of search results.
   * @param maxSearchResults Maximum number of search results
   */
  setMaxSearchResults(maxSearchResults: number): void {
    this.maxSearchResults = maxSearchResults;
  }

  /**
   * Gets the maximum web fetch depth.
   * @returns Maximum web fetch depth
   */
  getMaxWebFetchDepth(): number {
    return this.maxWebFetchDepth;
  }

  /**
   * Sets the maximum web fetch depth.
   * @param maxWebFetchDepth Maximum web fetch depth
   */
  setMaxWebFetchDepth(maxWebFetchDepth: number): void {
    this.maxWebFetchDepth = maxWebFetchDepth;
  }

  /**
   * Clears the research cache.
   */
  clearCache(): void {
    this.researchCache.clear();
  }
}
