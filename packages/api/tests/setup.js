"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file
global.console = {
    ...console,
    // Silence console.log during tests
    log: jest.fn(),
};
