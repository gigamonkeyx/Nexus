/**
 * AgentCommunication - Enables communication between agents
 * 
 * This module provides mechanisms for agents to communicate with each other,
 * share information, and coordinate their activities.
 */

import { NexusClient } from '../../core/NexusClient';
import { EventBus } from '../../core/EventBus';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

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

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline';
}

export class AgentCommunication {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private agents: Map<string, AgentInfo> = new Map();
  private messages: Message[] = [];
  private workspacePath: string;
  
  constructor(
    nexusClient: NexusClient,
    config: {
      workspacePath?: string;
    } = {}
  ) {
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.workspacePath = config.workspacePath || path.join(process.cwd(), 'agent-workspace');
    
    // Ensure workspace directory exists
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true });
    }
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Register an agent with the communication system
   */
  public registerAgent(agent: AgentInfo): void {
    this.agents.set(agent.id, agent);
    
    // Create agent directory in workspace
    const agentDir = path.join(this.workspacePath, agent.id);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    // Notify other agents
    this.broadcastAgentJoined(agent);
    
    logger.info(`Agent ${agent.name} (${agent.id}) registered with communication system`);
  }
  
  /**
   * Update agent status
   */
  public updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): void {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      logger.warn(`Cannot update status for unknown agent: ${agentId}`);
      return;
    }
    
    agent.status = status;
    this.agents.set(agentId, agent);
    
    // Notify other agents
    this.broadcastAgentStatusChanged(agent);
    
    logger.debug(`Agent ${agent.name} (${agentId}) status updated to ${status}`);
  }
  
  /**
   * Send a message to another agent
   */
  public sendMessage(message: Omit<Message, 'id' | 'timestamp'>): string {
    const id = this.generateMessageId();
    const timestamp = new Date().toISOString();
    
    const fullMessage: Message = {
      ...message,
      id,
      timestamp
    };
    
    // Store the message
    this.messages.push(fullMessage);
    
    // Save to workspace
    this.saveMessageToWorkspace(fullMessage);
    
    // Publish message event
    this.eventBus.publish('agent:message:sent', {
      messageId: id,
      from: message.from,
      to: message.to,
      type: message.type,
      subject: message.subject
    });
    
    logger.debug(`Message sent from ${message.from} to ${message.to}: ${message.subject}`);
    
    return id;
  }
  
  /**
   * Get messages for an agent
   */
  public getMessagesForAgent(agentId: string): Message[] {
    return this.messages.filter(message => message.to === agentId);
  }
  
  /**
   * Get unread messages for an agent
   */
  public getUnreadMessagesForAgent(agentId: string): Message[] {
    // In a real implementation, we would track read status
    // For now, we'll just return all messages
    return this.getMessagesForAgent(agentId);
  }
  
  /**
   * Mark a message as read
   */
  public markMessageAsRead(messageId: string, agentId: string): void {
    // In a real implementation, we would update read status
    logger.debug(`Message ${messageId} marked as read by ${agentId}`);
  }
  
  /**
   * Reply to a message
   */
  public replyToMessage(
    originalMessageId: string,
    from: string,
    content: any,
    type: 'response' = 'response'
  ): string {
    const originalMessage = this.messages.find(message => message.id === originalMessageId);
    
    if (!originalMessage) {
      throw new Error(`Cannot reply to unknown message: ${originalMessageId}`);
    }
    
    return this.sendMessage({
      from,
      to: originalMessage.from,
      type,
      subject: `Re: ${originalMessage.subject}`,
      content,
      replyTo: originalMessageId
    });
  }
  
  /**
   * Get all registered agents
   */
  public getAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents with specific capabilities
   */
  public getAgentsWithCapabilities(capabilities: string[]): AgentInfo[] {
    return this.getAgents().filter(agent => 
      capabilities.every(capability => agent.capabilities.includes(capability))
    );
  }
  
  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Share a file with another agent
   */
  public shareFile(
    fromAgentId: string,
    toAgentId: string,
    filePath: string,
    description: string
  ): string {
    // Copy the file to the recipient's workspace
    const fromAgent = this.agents.get(fromAgentId);
    const toAgent = this.agents.get(toAgentId);
    
    if (!fromAgent) {
      throw new Error(`Unknown sender agent: ${fromAgentId}`);
    }
    
    if (!toAgent) {
      throw new Error(`Unknown recipient agent: ${toAgentId}`);
    }
    
    const sourceFilePath = path.resolve(filePath);
    const fileName = path.basename(sourceFilePath);
    const destFilePath = path.join(this.workspacePath, toAgentId, fileName);
    
    // Copy the file
    fs.copyFileSync(sourceFilePath, destFilePath);
    
    // Send a message about the shared file
    return this.sendMessage({
      from: fromAgentId,
      to: toAgentId,
      type: 'notification',
      subject: `Shared file: ${fileName}`,
      content: {
        filePath: destFilePath,
        description
      }
    });
  }
  
  /**
   * Create a shared task for multiple agents
   */
  public createSharedTask(
    creatorAgentId: string,
    assigneeAgentIds: string[],
    taskName: string,
    taskDescription: string,
    taskData: any
  ): string {
    // Create a shared directory for the task
    const taskId = this.generateTaskId(taskName);
    const taskDir = path.join(this.workspacePath, 'shared-tasks', taskId);
    
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
    
    // Save task data
    const taskDataPath = path.join(taskDir, 'task-data.json');
    fs.writeFileSync(taskDataPath, JSON.stringify(taskData, null, 2));
    
    // Notify all assignees
    for (const assigneeId of assigneeAgentIds) {
      this.sendMessage({
        from: creatorAgentId,
        to: assigneeId,
        type: 'request',
        subject: `Task assignment: ${taskName}`,
        content: {
          taskId,
          taskName,
          taskDescription,
          taskDir,
          assignees: assigneeAgentIds
        }
      });
    }
    
    logger.info(`Shared task ${taskName} (${taskId}) created by ${creatorAgentId} for ${assigneeAgentIds.join(', ')}`);
    
    return taskId;
  }
  
  /**
   * Update task status
   */
  public updateTaskStatus(
    agentId: string,
    taskId: string,
    status: 'in_progress' | 'completed' | 'blocked',
    message: string
  ): void {
    // Get task directory
    const taskDir = path.join(this.workspacePath, 'shared-tasks', taskId);
    
    if (!fs.existsSync(taskDir)) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    
    // Update status file
    const statusFilePath = path.join(taskDir, 'status.json');
    
    let statusData: any = {};
    
    if (fs.existsSync(statusFilePath)) {
      statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
    }
    
    statusData[agentId] = {
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2));
    
    // Get task data to find assignees
    const taskDataPath = path.join(taskDir, 'task-data.json');
    const taskData = JSON.parse(fs.readFileSync(taskDataPath, 'utf-8'));
    
    // Notify other assignees
    for (const assigneeId of taskData.assignees || []) {
      if (assigneeId !== agentId) {
        this.sendMessage({
          from: agentId,
          to: assigneeId,
          type: 'update',
          subject: `Task status update: ${taskData.taskName}`,
          content: {
            taskId,
            status,
            message,
            agentId
          }
        });
      }
    }
    
    logger.debug(`Task ${taskId} status updated to ${status} by ${agentId}`);
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for agent creation events
    this.eventBus.subscribe('agent:created', (data) => {
      // If the agent isn't already registered, register it
      if (!this.agents.has(data.agentId)) {
        this.registerAgent({
          id: data.agentId,
          name: data.name,
          type: data.type,
          capabilities: data.capabilities || [],
          status: 'idle'
        });
      }
    });
  }
  
  /**
   * Broadcast agent joined notification
   */
  private broadcastAgentJoined(agent: AgentInfo): void {
    for (const otherAgent of this.agents.values()) {
      if (otherAgent.id !== agent.id) {
        this.sendMessage({
          from: 'system',
          to: otherAgent.id,
          type: 'notification',
          subject: 'Agent joined',
          content: {
            agent
          }
        });
      }
    }
  }
  
  /**
   * Broadcast agent status changed notification
   */
  private broadcastAgentStatusChanged(agent: AgentInfo): void {
    for (const otherAgent of this.agents.values()) {
      if (otherAgent.id !== agent.id) {
        this.sendMessage({
          from: 'system',
          to: otherAgent.id,
          type: 'notification',
          subject: 'Agent status changed',
          content: {
            agentId: agent.id,
            status: agent.status
          }
        });
      }
    }
  }
  
  /**
   * Save message to workspace
   */
  private saveMessageToWorkspace(message: Message): void {
    // Save to recipient's directory
    const recipientDir = path.join(this.workspacePath, message.to);
    
    if (!fs.existsSync(recipientDir)) {
      fs.mkdirSync(recipientDir, { recursive: true });
    }
    
    const messagesDir = path.join(recipientDir, 'messages');
    
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
    }
    
    const messageFilePath = path.join(messagesDir, `${message.id}.json`);
    fs.writeFileSync(messageFilePath, JSON.stringify(message, null, 2));
  }
  
  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `msg_${timestamp}_${random}`;
  }
  
  /**
   * Generate a unique task ID
   */
  private generateTaskId(taskName: string): string {
    const normalizedName = taskName.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `task_${normalizedName}_${timestamp}_${random}`;
  }
}
