module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  verbose: true,
  collectCoverage: false,
  // Make tests more forgiving in CI environment
  bail: 0, // Don't stop on first failure
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
  // Add retry for flaky tests
  retryTimes: 1,
  // Ensure proper cleanup
  clearMocks: true,
  restoreMocks: true
};