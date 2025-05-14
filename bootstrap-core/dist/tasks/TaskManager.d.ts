/**
 * Task Manager
 *
 * Manages tasks assigned to agents and tracks their status.
 */
import { AgentCommunication } from '../communication/AgentCommunication';
import { Task } from '../types/TaskTypes';
export declare class TaskManager {
    private agentId;
    private agentCommunication;
    private tasks;
    private currentTaskId;
    constructor(agentId: string, agentCommunication: AgentCommunication);
    /**
     * Add a task
     */
    addTask(task: Task): void;
    /**
     * Get a task by ID
     */
    getTask(taskId: string): Task | undefined;
    /**
     * Get all tasks
     */
    getAllTasks(): Task[];
    /**
     * Get current task
     */
    getCurrentTask(): Task | null;
    /**
     * Set current task
     */
    setCurrentTask(taskId: string): void;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, agentId: string, status: 'in_progress' | 'completed' | 'blocked', message: string): void;
    /**
     * Update current task status
     */
    updateCurrentTaskStatus(status: 'in_progress' | 'completed' | 'blocked', message: string): void;
    /**
     * Update task progress
     */
    updateTaskProgress(taskId: string, progress: number): void;
    /**
     * Update current task progress
     */
    updateCurrentTaskProgress(progress: number): void;
    /**
     * Get next task
     */
    getNextTask(): Task | null;
    /**
     * Move to next task
     */
    moveToNextTask(): boolean;
    /**
     * Parse tasks from markdown
     */
    parseTasksFromMarkdown(markdown: string): any[];
}
