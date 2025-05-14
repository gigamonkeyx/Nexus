/**
 * LLMAdapter
 * 
 * Interface for adapters that provide access to language models.
 */

/**
 * Message role
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool'
}

/**
 * Message
 */
export interface Message {
  role: string;
  content: string;
  name?: string;
  tool_call_id?: string;
}

/**
 * Completion
 */
export interface Completion {
  content: string;
  finish_reason: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * LLM provider
 */
export enum LLMProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  OLLAMA = 'ollama',
  CLAUDE = 'claude',
  GEMINI = 'gemini'
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
}

/**
 * LLMAdapter interface for adapters that provide access to language models.
 */
export interface LLMAdapter {
  /**
   * Generates a completion from messages.
   * @param messages Messages
   * @param options Additional options
   * @returns Completion
   */
  generateCompletion(messages: Message[], options?: any): Promise<Completion>;

  /**
   * Generates a streaming completion from messages.
   * @param messages Messages
   * @param callback Callback for each chunk
   * @param options Additional options
   * @returns Completion
   */
  generateStreamingCompletion(messages: Message[], callback: (chunk: any) => void, options?: any): Promise<Completion>;

  /**
   * Creates embeddings for text.
   * @param text Text to embed
   * @param options Additional options
   * @returns Embeddings
   */
  createEmbeddings(text: string | string[], options?: any): Promise<number[][]>;

  /**
   * Gets the provider.
   * @returns Provider
   */
  getProvider(): string;

  /**
   * Gets the model.
   * @returns Model
   */
  getModel(): string;

  /**
   * Gets the configuration.
   * @returns Configuration
   */
  getConfig(): LLMConfig;
}
