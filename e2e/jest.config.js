// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup.js'],
  testSequencer: './sequencer.js',
  testTimeout: 60000,
  verbose: true,
  collectCoverage: false,
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true
};