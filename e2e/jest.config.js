
module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  verbose: true,
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  // Remove the deprecated retryTimes option
  // Use testRetries instead if you need retry functionality
  // testRetries: 1,
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage settings (optional)
  collectCoverage: false,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Handle async operations better
  detectOpenHandles: true,
  forceExit: true
};