/**
 * Jest Setup File
 * 
 * This file is run before each test file.
 */

// Increase the timeout for all tests
jest.setTimeout(10000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Silence info and debug
  info: jest.fn(),
  debug: jest.fn(),
  // Keep log for explicit logging during tests
  log: console.log
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});

// Global beforeEach and afterEach
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any global state after each test
});

// Global beforeAll and afterAll
beforeAll(() => {
  // Set up any global state before all tests
});

afterAll(() => {
  // Clean up any global state after all tests
});
