/**
 * Message Types
 * 
 * Type definitions for messages in the bootstrapping approach.
 */

/**
 * Message
 */
export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'update';
  subject: string;
  content: any;
  timestamp: string;
  replyTo?: string;
}

/**
 * Message request
 */
export interface MessageRequest {
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'update';
  subject: string;
  content: any;
  replyTo?: string;
}

/**
 * Task assignment message
 */
export interface TaskAssignmentMessage {
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskDir: string;
  assignees: string[];
}

/**
 * Task status update message
 */
export interface TaskStatusUpdateMessage {
  taskId: string;
  agentId: string;
  status: 'in_progress' | 'completed' | 'blocked';
  message: string;
}

/**
 * File share message
 */
export interface FileShareMessage {
  filePath: string;
  description: string;
}

/**
 * Benchmark request message
 */
export interface BenchmarkRequestMessage {
  agentId: string;
  benchmarkType: string;
  options: Record<string, any>;
}
