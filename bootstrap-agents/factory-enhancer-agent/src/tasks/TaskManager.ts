/**
 * Task Manager
 * 
 * Manages tasks assigned to the agent and tracks their status.
 */

import { AgentCommunication } from '../communication/AgentCommunication';
import { logger } from '../utils/logger';

export interface Task {
  id: string;
  name: string;
  description: string;
  assignees: string[];
  status: 'assigned' | 'in_progress' | 'completed' | 'blocked';
  progress?: number;
  startTime?: string;
  endTime?: string;
}

export class TaskManager {
  private agentId: string;
  private agentCommunication: AgentCommunication;
  private tasks: Map<string, Task> = new Map();
  private currentTaskId: string | null = null;
  
  constructor(agentId: string, agentCommunication: AgentCommunication) {
    this.agentId = agentId;
    this.agentCommunication = agentCommunication;
  }
  
  /**
   * Add a task
   */
  public addTask(task: Task): void {
    this.tasks.set(task.id, task);
    
    // If no current task, set this as current
    if (!this.currentTaskId) {
      this.currentTaskId = task.id;
    }
    
    logger.info(`Task added: ${task.name} (${task.id})`);
  }
  
  /**
   * Get a task by ID
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get all tasks
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Get current task
   */
  public getCurrentTask(): Task | null {
    if (!this.currentTaskId) {
      return null;
    }
    
    return this.tasks.get(this.currentTaskId) || null;
  }
  
  /**
   * Set current task
   */
  public setCurrentTask(taskId: string): void {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    
    this.currentTaskId = taskId;
    logger.info(`Current task set to: ${this.tasks.get(taskId)?.name} (${taskId})`);
  }
  
  /**
   * Update task status
   */
  public updateTaskStatus(taskId: string, agentId: string, status: 'in_progress' | 'completed' | 'blocked', message: string): void {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    
    // Update task status
    task.status = status;
    
    // Update timestamps
    if (status === 'in_progress' && !task.startTime) {
      task.startTime = new Date().toISOString();
    } else if (status === 'completed' && !task.endTime) {
      task.endTime = new Date().toISOString();
    }
    
    // Save task
    this.tasks.set(taskId, task);
    
    // Update status in communication system
    this.agentCommunication.updateTaskStatus(agentId, taskId, status, message);
    
    logger.info(`Task ${task.name} (${taskId}) status updated to ${status}`);
  }
  
  /**
   * Update current task status
   */
  public updateCurrentTaskStatus(status: 'in_progress' | 'completed' | 'blocked', message: string): void {
    if (!this.currentTaskId) {
      throw new Error('No current task');
    }
    
    this.updateTaskStatus(this.currentTaskId, this.agentId, status, message);
  }
  
  /**
   * Update task progress
   */
  public updateTaskProgress(taskId: string, progress: number): void {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    
    // Update progress
    task.progress = Math.min(100, Math.max(0, progress));
    
    // Save task
    this.tasks.set(taskId, task);
    
    logger.debug(`Task ${task.name} (${taskId}) progress updated to ${progress}%`);
  }
  
  /**
   * Update current task progress
   */
  public updateCurrentTaskProgress(progress: number): void {
    if (!this.currentTaskId) {
      throw new Error('No current task');
    }
    
    this.updateTaskProgress(this.currentTaskId, progress);
  }
  
  /**
   * Get next task
   */
  public getNextTask(): Task | null {
    if (!this.currentTaskId) {
      // Get first task that's not completed or blocked
      for (const task of this.tasks.values()) {
        if (task.status !== 'completed' && task.status !== 'blocked') {
          return task;
        }
      }
      
      return null;
    }
    
    // Get tasks as array
    const tasksArray = Array.from(this.tasks.values());
    
    // Find current task index
    const currentIndex = tasksArray.findIndex(task => task.id === this.currentTaskId);
    
    if (currentIndex === -1) {
      return null;
    }
    
    // Find next task that's not completed or blocked
    for (let i = currentIndex + 1; i < tasksArray.length; i++) {
      if (tasksArray[i].status !== 'completed' && tasksArray[i].status !== 'blocked') {
        return tasksArray[i];
      }
    }
    
    return null;
  }
  
  /**
   * Move to next task
   */
  public moveToNextTask(): boolean {
    const nextTask = this.getNextTask();
    
    if (!nextTask) {
      return false;
    }
    
    this.currentTaskId = nextTask.id;
    logger.info(`Moved to next task: ${nextTask.name} (${nextTask.id})`);
    
    return true;
  }
}
