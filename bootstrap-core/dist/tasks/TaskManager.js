"use strict";
/**
 * Task Manager
 *
 * Manages tasks assigned to agents and tracks their status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const logger_1 = require("../utils/logger");
class TaskManager {
    constructor(agentId, agentCommunication) {
        this.tasks = new Map();
        this.currentTaskId = null;
        this.agentId = agentId;
        this.agentCommunication = agentCommunication;
    }
    /**
     * Add a task
     */
    addTask(task) {
        this.tasks.set(task.id, task);
        // If no current task, set this as current
        if (!this.currentTaskId) {
            this.currentTaskId = task.id;
        }
        logger_1.logger.info(`Task added: ${task.name} (${task.id})`);
    }
    /**
     * Get a task by ID
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Get all tasks
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * Get current task
     */
    getCurrentTask() {
        if (!this.currentTaskId) {
            return null;
        }
        return this.tasks.get(this.currentTaskId) || null;
    }
    /**
     * Set current task
     */
    setCurrentTask(taskId) {
        if (!this.tasks.has(taskId)) {
            throw new Error(`Unknown task: ${taskId}`);
        }
        this.currentTaskId = taskId;
        logger_1.logger.info(`Current task set to: ${this.tasks.get(taskId)?.name} (${taskId})`);
    }
    /**
     * Update task status
     */
    updateTaskStatus(taskId, agentId, status, message) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Unknown task: ${taskId}`);
        }
        // Update task status
        task.status = status;
        // Update timestamps
        if (status === 'in_progress' && !task.startTime) {
            task.startTime = new Date().toISOString();
        }
        else if (status === 'completed' && !task.endTime) {
            task.endTime = new Date().toISOString();
        }
        // Save task
        this.tasks.set(taskId, task);
        // Update status in communication system
        this.agentCommunication.updateTaskStatus(agentId, taskId, status, message);
        logger_1.logger.info(`Task ${task.name} (${taskId}) status updated to ${status}`);
    }
    /**
     * Update current task status
     */
    updateCurrentTaskStatus(status, message) {
        if (!this.currentTaskId) {
            throw new Error('No current task');
        }
        this.updateTaskStatus(this.currentTaskId, this.agentId, status, message);
    }
    /**
     * Update task progress
     */
    updateTaskProgress(taskId, progress) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Unknown task: ${taskId}`);
        }
        // Update progress
        task.progress = Math.min(100, Math.max(0, progress));
        // Save task
        this.tasks.set(taskId, task);
        logger_1.logger.debug(`Task ${task.name} (${taskId}) progress updated to ${progress}%`);
    }
    /**
     * Update current task progress
     */
    updateCurrentTaskProgress(progress) {
        if (!this.currentTaskId) {
            throw new Error('No current task');
        }
        this.updateTaskProgress(this.currentTaskId, progress);
    }
    /**
     * Get next task
     */
    getNextTask() {
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
    moveToNextTask() {
        const nextTask = this.getNextTask();
        if (!nextTask) {
            return false;
        }
        this.currentTaskId = nextTask.id;
        logger_1.logger.info(`Moved to next task: ${nextTask.name} (${nextTask.id})`);
        return true;
    }
    /**
     * Parse tasks from markdown
     */
    parseTasksFromMarkdown(markdown) {
        const tasks = [];
        // Simple parser for task specifications in markdown
        const taskRegex = /## Task (\d+): ([^\n]+)\n\n### Overview\n\n([^#]+)### Requirements\n\n([\s\S]+?)(?=### Implementation Details|$)/g;
        let match;
        while ((match = taskRegex.exec(markdown)) !== null) {
            const taskNumber = parseInt(match[1]);
            const taskName = match[2].trim();
            const overview = match[3].trim();
            const requirementsText = match[4].trim();
            // Parse requirements
            const requirements = [];
            const reqRegex = /\d+\.\s+([^\n]+)/g;
            let reqMatch;
            while ((reqMatch = reqRegex.exec(requirementsText)) !== null) {
                requirements.push(reqMatch[1].trim());
            }
            tasks.push({
                number: taskNumber,
                name: taskName,
                overview,
                requirements,
                status: 'pending'
            });
        }
        return tasks;
    }
}
exports.TaskManager = TaskManager;
