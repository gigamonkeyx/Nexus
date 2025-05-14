/**
 * Task Types
 * 
 * Type definitions for tasks in the bootstrapping approach.
 */

/**
 * Task
 */
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

/**
 * Task specification
 */
export interface TaskSpecification {
  number: number;
  name: string;
  overview: string;
  requirements: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Task data
 */
export interface TaskData {
  assignees: string[];
  tasks: {
    agentId: string;
    task: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dependencies: string[];
  }[];
}
