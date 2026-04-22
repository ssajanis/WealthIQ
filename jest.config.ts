import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/unit/**/*.test.tsx'],
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/*.d.ts'],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
