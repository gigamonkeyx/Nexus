/**
 * EventBus
 * 
 * A centralized event bus for inter-module communication.
 */

import { logger } from '../utils/logger';

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Event subscription interface
 */
export interface EventSubscription {
  /**
   * Unsubscribe from the event
   */
  unsubscribe(): void;
}

/**
 * EventBus provides a centralized event bus for inter-module communication.
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the EventBus instance
   * @returns EventBus instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * @param eventName Event name
   * @param handler Event handler
   * @returns Subscription that can be used to unsubscribe
   */
  public subscribe<T = any>(eventName: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);
    
    logger.debug(`Subscribed to event: ${eventName}`);

    return {
      unsubscribe: () => {
        this.unsubscribe(eventName, handler);
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param eventName Event name
   * @param handler Event handler
   * @returns Subscription that can be used to unsubscribe
   */
  public once<T = any>(eventName: string, handler: EventHandler<T>): EventSubscription {
    if (!this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }

    this.onceHandlers.get(eventName)!.add(handler);
    
    logger.debug(`Subscribed once to event: ${eventName}`);

    return {
      unsubscribe: () => {
        if (this.onceHandlers.has(eventName)) {
          this.onceHandlers.get(eventName)!.delete(handler);
        }
      }
    };
  }

  /**
   * Unsubscribe from an event
   * @param eventName Event name
   * @param handler Event handler
   */
  public unsubscribe<T = any>(eventName: string, handler: EventHandler<T>): void {
    if (this.handlers.has(eventName)) {
      this.handlers.get(eventName)!.delete(handler);
      if (this.handlers.get(eventName)!.size === 0) {
        this.handlers.delete(eventName);
      }
      logger.debug(`Unsubscribed from event: ${eventName}`);
    }
  }

  /**
   * Publish an event
   * @param eventName Event name
   * @param data Event data
   */
  public async publish<T = any>(eventName: string, data?: T): Promise<void> {
    logger.debug(`Publishing event: ${eventName}`);
    
    const handlers = this.handlers.get(eventName);
    const onceHandlers = this.onceHandlers.get(eventName);
    
    const promises: Promise<void>[] = [];
    
    // Regular handlers
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          logger.error(`Error in event handler for ${eventName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Once handlers
    if (onceHandlers) {
      const handlersArray = Array.from(onceHandlers);
      this.onceHandlers.delete(eventName);
      
      for (const handler of handlersArray) {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          logger.error(`Error in once event handler for ${eventName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Wait for all promises to resolve
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Check if an event has subscribers
   * @param eventName Event name
   * @returns True if the event has subscribers
   */
  public hasSubscribers(eventName: string): boolean {
    return (
      (this.handlers.has(eventName) && this.handlers.get(eventName)!.size > 0) ||
      (this.onceHandlers.has(eventName) && this.onceHandlers.get(eventName)!.size > 0)
    );
  }

  /**
   * Get the number of subscribers for an event
   * @param eventName Event name
   * @returns Number of subscribers
   */
  public getSubscriberCount(eventName: string): number {
    let count = 0;
    
    if (this.handlers.has(eventName)) {
      count += this.handlers.get(eventName)!.size;
    }
    
    if (this.onceHandlers.has(eventName)) {
      count += this.onceHandlers.get(eventName)!.size;
    }
    
    return count;
  }

  /**
   * Clear all event handlers
   */
  public clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
    logger.debug('Cleared all event handlers');
  }
}
