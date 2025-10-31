import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.ts and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: '<rootDir>/docs/test-coverage/jest',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**', // Exclude Next.js app router
    '!src/types/**', // Exclude type definitions
  ],
  coverageThreshold: {
    global: {
      // PHASED COVERAGE ROADMAP (See docs/architecture/TESTING_COVERAGE_ROADMAP.md)
      // Current: 11.74% statements, 11.82% lines, 9.37% functions, 6.26% branches
      // Phase 1 Target: Match current coverage | Phase 2: 40% | Phase 3: 80%
      // Incremental increases to allow CI to pass while systematically expanding coverage
      branches: 6,
      functions: 9,
      lines: 11,
      statements: 11,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
