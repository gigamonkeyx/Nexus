/**
 * Agent Communication Module
 *
 * Provides communication capabilities for agents to interact with each other.
 */

import { NexusClient } from 'bootstrap-core';
import { logger } from '../utils/logger';
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
  private agents: Map<string, AgentInfo> = new Map();
  private messages: Message[] = [];
  private readMessages: Set<string> = new Set();
  private workspacePath: string;

  constructor(
    nexusClient: NexusClient,
    config: {
      workspacePath?: string;
    } = {}
  ) {
    this.nexusClient = nexusClient;
    this.workspacePath = config.workspacePath || path.join(process.cwd(), 'agent-workspace');

    // Ensure workspace directory exists
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true });
    }

    // Load existing messages and agents
    this.loadMessages();
    this.loadAgents();
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

    // Save agent info
    this.saveAgents();

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

    // Save agent info
    this.saveAgents();

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
    return this.getMessagesForAgent(agentId)
      .filter(message => !this.readMessages.has(`${agentId}:${message.id}`));
  }

  /**
   * Mark a message as read
   */
  public markMessageAsRead(messageId: string, agentId: string): void {
    this.readMessages.add(`${agentId}:${messageId}`);

    // Save read status
    this.saveReadStatus();

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

    if (!fromAgent && fromAgentId !== 'system') {
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

    if (!fs.existsSync(path.dirname(taskDir))) {
      fs.mkdirSync(path.dirname(taskDir), { recursive: true });
    }

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

    if (fs.existsSync(taskDataPath)) {
      const taskData = JSON.parse(fs.readFileSync(taskDataPath, 'utf-8'));

      // Notify other assignees
      for (const assigneeId of taskData.assignees || []) {
        if (assigneeId !== agentId) {
          this.sendMessage({
            from: agentId,
            to: assigneeId,
            type: 'update',
            subject: `Task status update: ${taskData.taskName || taskId}`,
            content: {
              taskId,
              status,
              message,
              agentId
            }
          });
        }
      }
    }

    logger.debug(`Task ${taskId} status updated to ${status} by ${agentId}`);
  }

  /**
   * Load messages from workspace
   */
  private loadMessages(): void {
    try {
      // Check if agents directory exists
      const agentsDir = path.join(this.workspacePath);

      if (!fs.existsSync(agentsDir)) {
        return;
      }

      // Get all agent directories
      const agentDirs = fs.readdirSync(agentsDir)
        .filter(dir => fs.statSync(path.join(agentsDir, dir)).isDirectory());

      // Load messages from each agent directory
      for (const agentDir of agentDirs) {
        const messagesDir = path.join(agentsDir, agentDir, 'messages');

        if (fs.existsSync(messagesDir)) {
          const messageFiles = fs.readdirSync(messagesDir)
            .filter(file => file.endsWith('.json'));

          for (const messageFile of messageFiles) {
            const messageFilePath = path.join(messagesDir, messageFile);
            const messageContent = fs.readFileSync(messageFilePath, 'utf-8');

            try {
              const message = JSON.parse(messageContent) as Message;

              // Add to messages if not already present
              if (!this.messages.some(m => m.id === message.id)) {
                this.messages.push(message);
              }
            } catch (error) {
              logger.warn(`Failed to parse message file: ${messageFilePath}`);
            }
          }
        }
      }

      // Load read status
      const readStatusPath = path.join(this.workspacePath, 'read-status.json');

      if (fs.existsSync(readStatusPath)) {
        try {
          const readStatusContent = fs.readFileSync(readStatusPath, 'utf-8');
          const readStatus = JSON.parse(readStatusContent) as string[];

          this.readMessages = new Set(readStatus);
        } catch (error) {
          logger.warn(`Failed to parse read status file: ${readStatusPath}`);
        }
      }

      logger.debug(`Loaded ${this.messages.length} messages from workspace`);
    } catch (error) {
      logger.error(`Failed to load messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load agents from workspace
   */
  private loadAgents(): void {
    try {
      const agentsFilePath = path.join(this.workspacePath, 'agents.json');

      if (fs.existsSync(agentsFilePath)) {
        const agentsContent = fs.readFileSync(agentsFilePath, 'utf-8');
        const agents = JSON.parse(agentsContent) as AgentInfo[];

        for (const agent of agents) {
          this.agents.set(agent.id, agent);
        }

        logger.debug(`Loaded ${agents.length} agents from workspace`);
      }
    } catch (error) {
      logger.error(`Failed to load agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save agents to workspace
   */
  private saveAgents(): void {
    try {
      const agentsFilePath = path.join(this.workspacePath, 'agents.json');
      const agents = Array.from(this.agents.values());

      fs.writeFileSync(agentsFilePath, JSON.stringify(agents, null, 2));
    } catch (error) {
      logger.error(`Failed to save agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save read status to workspace
   */
  private saveReadStatus(): void {
    try {
      const readStatusPath = path.join(this.workspacePath, 'read-status.json');
      const readStatus = Array.from(this.readMessages);

      fs.writeFileSync(readStatusPath, JSON.stringify(readStatus, null, 2));
    } catch (error) {
      logger.error(`Failed to save read status: ${error instanceof Error ? error.message : String(error)}`);
    }
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
