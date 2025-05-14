/**
 * Event Bus
 * 
 * Simple event bus for publishing and subscribing to events.
 */

import { logger } from '../utils/logger';

export class EventBus {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  
  /**
   * Subscribe to an event
   */
  public subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(event, callback);
    };
  }
  
  /**
   * Unsubscribe from an event
   */
  public unsubscribe(event: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(event)) {
      return;
    }
    
    this.subscribers.get(event)!.delete(callback);
    
    // Clean up if no subscribers left
    if (this.subscribers.get(event)!.size === 0) {
      this.subscribers.delete(event);
    }
  }
  
  /**
   * Publish an event
   */
  public publish(event: string, data: any): void {
    if (!this.subscribers.has(event)) {
      return;
    }
    
    for (const callback of this.subscribers.get(event)!) {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in event subscriber for ${event}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  /**
   * Check if an event has subscribers
   */
  public hasSubscribers(event: string): boolean {
    return this.subscribers.has(event) && this.subscribers.get(event)!.size > 0;
  }
  
  /**
   * Get the number of subscribers for an event
   */
  public getSubscriberCount(event: string): number {
    if (!this.subscribers.has(event)) {
      return 0;
    }
    
    return this.subscribers.get(event)!.size;
  }
  
  /**
   * Get all events with subscribers
   */
  public getEvents(): string[] {
    return Array.from(this.subscribers.keys());
  }
  
  /**
   * Clear all subscribers
   */
  public clear(): void {
    this.subscribers.clear();
  }
}
