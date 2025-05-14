/**
 * Event Bus
 *
 * Simple event bus for publishing and subscribing to events.
 */
export declare class EventBus {
    private subscribers;
    /**
     * Subscribe to an event
     */
    subscribe(event: string, callback: (data: any) => void): () => void;
    /**
     * Unsubscribe from an event
     */
    unsubscribe(event: string, callback: (data: any) => void): void;
    /**
     * Publish an event
     */
    publish(event: string, data: any): void;
    /**
     * Check if an event has subscribers
     */
    hasSubscribers(event: string): boolean;
    /**
     * Get the number of subscribers for an event
     */
    getSubscriberCount(event: string): number;
    /**
     * Get all events with subscribers
     */
    getEvents(): string[];
    /**
     * Clear all subscribers
     */
    clear(): void;
}
