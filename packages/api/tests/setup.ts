// Jest setup file
global.console = {
  ...console,
  // Silence console.log during tests
  log: jest.fn(),
};
