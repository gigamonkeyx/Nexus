/**
 * EventBus Tests
 */

import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Reset the EventBus instance before each test
    // @ts-ignore - Accessing private static property for testing
    EventBus.instance = undefined;
    eventBus = EventBus.getInstance();
  });

  afterEach(() => {
    // Clear all event handlers after each test
    eventBus.clear();
  });

  test('getInstance returns a singleton instance', () => {
    const instance1 = EventBus.getInstance();
    const instance2 = EventBus.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('subscribe adds an event handler', async () => {
    const handler = jest.fn();
    eventBus.subscribe('test-event', handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.get('test-event')).toContain(handler);
  });

  test('subscribeOnce adds a one-time event handler', async () => {
    const handler = jest.fn();
    eventBus.subscribeOnce('test-event', handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.oneTimeHandlers.get('test-event')).toContain(handler);
  });

  test('unsubscribe removes an event handler', async () => {
    const handler = jest.fn();
    eventBus.subscribe('test-event', handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.get('test-event')).toContain(handler);
    
    // Unsubscribe the handler
    const result = eventBus.unsubscribe('test-event', handler);
    
    // Verify the handler was removed
    expect(result).toBe(true);
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.get('test-event')).not.toContain(handler);
  });

  test('unsubscribeOnce removes a one-time event handler', async () => {
    const handler = jest.fn();
    eventBus.subscribeOnce('test-event', handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.oneTimeHandlers.get('test-event')).toContain(handler);
    
    // Unsubscribe the handler
    const result = eventBus.unsubscribeOnce('test-event', handler);
    
    // Verify the handler was removed
    expect(result).toBe(true);
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.oneTimeHandlers.get('test-event')).not.toContain(handler);
  });

  test('publish calls all event handlers', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const data = { test: 'data' };
    
    eventBus.subscribe('test-event', handler1);
    eventBus.subscribe('test-event', handler2);
    
    await eventBus.publish('test-event', data);
    
    expect(handler1).toHaveBeenCalledWith(data);
    expect(handler2).toHaveBeenCalledWith(data);
  });

  test('publish calls one-time event handlers only once', async () => {
    const handler = jest.fn();
    const data = { test: 'data' };
    
    eventBus.subscribeOnce('test-event', handler);
    
    await eventBus.publish('test-event', data);
    await eventBus.publish('test-event', data);
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(data);
  });

  test('clear removes all event handlers', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    eventBus.subscribe('test-event-1', handler1);
    eventBus.subscribeOnce('test-event-2', handler2);
    
    eventBus.clear();
    
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.size).toBe(0);
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.oneTimeHandlers.size).toBe(0);
  });

  test('clearEvent removes all handlers for a specific event', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();
    
    eventBus.subscribe('test-event-1', handler1);
    eventBus.subscribe('test-event-2', handler2);
    eventBus.subscribeOnce('test-event-1', handler3);
    
    eventBus.clearEvent('test-event-1');
    
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.has('test-event-1')).toBe(false);
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.oneTimeHandlers.has('test-event-1')).toBe(false);
    // @ts-ignore - Accessing private property for testing
    expect(eventBus.handlers.has('test-event-2')).toBe(true);
  });

  test('getEvents returns all events with handlers', async () => {
    eventBus.subscribe('test-event-1', jest.fn());
    eventBus.subscribeOnce('test-event-2', jest.fn());
    
    const events = eventBus.getEvents();
    
    expect(events).toContain('test-event-1');
    expect(events).toContain('test-event-2');
    expect(events.length).toBe(2);
  });

  test('getHandlerCount returns the number of handlers for an event', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();
    
    eventBus.subscribe('test-event', handler1);
    eventBus.subscribe('test-event', handler2);
    eventBus.subscribeOnce('test-event', handler3);
    
    const count = eventBus.getHandlerCount('test-event');
    
    expect(count).toBe(3);
  });

  test('hasHandlers returns true if an event has handlers', async () => {
    eventBus.subscribe('test-event', jest.fn());
    
    expect(eventBus.hasHandlers('test-event')).toBe(true);
    expect(eventBus.hasHandlers('non-existent-event')).toBe(false);
  });

  test('publish handles errors in event handlers', async () => {
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const successHandler = jest.fn();
    
    eventBus.subscribe('test-event', errorHandler);
    eventBus.subscribe('test-event', successHandler);
    
    // This should not throw an error
    await eventBus.publish('test-event');
    
    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });
});
