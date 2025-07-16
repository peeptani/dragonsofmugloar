module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@dragons-mugloar/shared$': '<rootDir>/../shared/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
