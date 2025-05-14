/**
 * Agent Communication Module
 *
 * Provides communication capabilities for agents to interact with each other.
 */
import { NexusClient } from '../core/NexusClient';
import { AgentInfo } from '../types/AgentTypes';
import { Message, MessageRequest } from '../types/MessageTypes';
export declare class AgentCommunication {
    private nexusClient;
    private agents;
    private messages;
    private readMessages;
    private workspacePath;
    constructor(nexusClient: NexusClient, config?: {
        workspacePath?: string;
    });
    /**
     * Register an agent with the communication system
     */
    registerAgent(agent: AgentInfo): void;
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): void;
    /**
     * Send a message to another agent
     */
    sendMessage(message: MessageRequest): string;
    /**
     * Get messages for an agent
     */
    getMessagesForAgent(agentId: string): Message[];
    /**
     * Get unread messages for an agent
     */
    getUnreadMessagesForAgent(agentId: string): Message[];
    /**
     * Mark a message as read
     */
    markMessageAsRead(messageId: string, agentId: string): void;
    /**
     * Reply to a message
     */
    replyToMessage(originalMessageId: string, from: string, content: any, type?: 'response'): string;
    /**
     * Get all registered agents
     */
    getAgents(): AgentInfo[];
    /**
     * Get agents with specific capabilities
     */
    getAgentsWithCapabilities(capabilities: string[]): AgentInfo[];
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentInfo | undefined;
    /**
     * Share a file with another agent
     */
    shareFile(fromAgentId: string, toAgentId: string, filePath: string, description: string): string;
    /**
     * Create a shared task for multiple agents
     */
    createSharedTask(creatorAgentId: string, assigneeAgentIds: string[], taskName: string, taskDescription: string, taskData: any): string;
    /**
     * Update task status
     */
    updateTaskStatus(agentId: string, taskId: string, status: 'in_progress' | 'completed' | 'blocked', message: string): void;
    /**
     * Load messages from workspace
     */
    private loadMessages;
    /**
     * Load agents from workspace
     */
    private loadAgents;
    /**
     * Save agents to workspace
     */
    private saveAgents;
    /**
     * Save read status to workspace
     */
    private saveReadStatus;
    /**
     * Broadcast agent joined notification
     */
    private broadcastAgentJoined;
    /**
     * Broadcast agent status changed notification
     */
    private broadcastAgentStatusChanged;
    /**
     * Save message to workspace
     */
    private saveMessageToWorkspace;
    /**
     * Generate a unique message ID
     */
    private generateMessageId;
    /**
     * Generate a unique task ID
     */
    private generateTaskId;
}
