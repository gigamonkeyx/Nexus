/**
 * Ollama MCP Adapter
 *
 * Adapter for the Ollama MCP server.
 */
import { NexusClient } from '../core/NexusClient';
export interface OllamaGenerationOptions {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
    stop?: string[];
    [key: string]: any;
}
export declare class OllamaMCPAdapter {
    private nexusClient;
    private serverId;
    constructor(nexusClient: NexusClient, serverId: string);
    /**
     * Get the server ID
     */
    getServerId(): string;
    /**
     * Generate text using Ollama
     */
    generateText(prompt: string, model?: string, options?: OllamaGenerationOptions): Promise<string>;
    /**
     * Generate code using Ollama
     */
    generateCode(prompt: string, language: string, options?: OllamaGenerationOptions): Promise<string>;
    /**
     * Extract code from a response
     */
    private extractCode;
    /**
     * Chat with Ollama
     */
    chat(messages: {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }[], model?: string, options?: OllamaGenerationOptions): Promise<string>;
    /**
     * Embed text using Ollama
     */
    embedText(text: string, model?: string): Promise<number[]>;
}
