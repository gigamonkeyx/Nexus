"use strict";
/**
 * Event Bus
 *
 * Simple event bus for publishing and subscribing to events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const logger_1 = require("../utils/logger");
class EventBus {
    constructor() {
        this.subscribers = new Map();
    }
    /**
     * Subscribe to an event
     */
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
        // Return unsubscribe function
        return () => {
            this.unsubscribe(event, callback);
        };
    }
    /**
     * Unsubscribe from an event
     */
    unsubscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            return;
        }
        this.subscribers.get(event).delete(callback);
        // Clean up if no subscribers left
        if (this.subscribers.get(event).size === 0) {
            this.subscribers.delete(event);
        }
    }
    /**
     * Publish an event
     */
    publish(event, data) {
        if (!this.subscribers.has(event)) {
            return;
        }
        for (const callback of this.subscribers.get(event)) {
            try {
                callback(data);
            }
            catch (error) {
                logger_1.logger.error(`Error in event subscriber for ${event}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Check if an event has subscribers
     */
    hasSubscribers(event) {
        return this.subscribers.has(event) && this.subscribers.get(event).size > 0;
    }
    /**
     * Get the number of subscribers for an event
     */
    getSubscriberCount(event) {
        if (!this.subscribers.has(event)) {
            return 0;
        }
        return this.subscribers.get(event).size;
    }
    /**
     * Get all events with subscribers
     */
    getEvents() {
        return Array.from(this.subscribers.keys());
    }
    /**
     * Clear all subscribers
     */
    clear() {
        this.subscribers.clear();
    }
}
exports.EventBus = EventBus;
