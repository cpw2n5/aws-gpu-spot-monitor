/**
 * Mock implementation of the logger utility
 */

// Store logs for inspection in tests
const logs = {
  info: [],
  warn: [],
  error: [],
  debug: []
};

// Reset logs
const resetLogs = () => {
  logs.info = [];
  logs.warn = [];
  logs.error = [];
  logs.debug = [];
};

// Mock logger functions
const info = jest.fn().mockImplementation((message, meta = {}) => {
  logs.info.push({ message, meta });
  return null;
});

const warn = jest.fn().mockImplementation((message, meta = {}) => {
  logs.warn.push({ message, meta });
  return null;
});

const error = jest.fn().mockImplementation((message, meta = {}) => {
  logs.error.push({ message, meta });
  return null;
});

const debug = jest.fn().mockImplementation((message, meta = {}) => {
  logs.debug.push({ message, meta });
  return null;
});

// Mock withCorrelationId function
const withCorrelationId = jest.fn().mockImplementation((fn, correlationId) => {
  // Execute the function and return its result
  return fn();
});

module.exports = {
  info,
  warn,
  error,
  debug,
  withCorrelationId,
  logs,
  resetLogs
};