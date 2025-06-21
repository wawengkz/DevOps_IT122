
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
  testTimeout: 60000,
  // Remove the invalid retryTimes option
  // retryTimes: 1,  // This was causing the warning
  
  // Add proper retry configuration
  testRetries: 1,
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/test-env.js']
};