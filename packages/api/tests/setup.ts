// Jest setup file
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global test timeout
jest.setTimeout(30000);

// Global test environment setup
process.env.NODE_ENV = 'test';
