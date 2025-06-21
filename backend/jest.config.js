module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!coverage/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  
  // Remove the invalid retryTimes - use jest-retry instead if needed
  // For Jest 27+, use this instead:
  // testRetries: 1,
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/test-env.js']
};