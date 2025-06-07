// e2e/setup.js
// Global test setup
beforeAll(async () => {
  console.log('🎭 Starting E2E Test Suite');
  console.log('Frontend URL: http://localhost:8080');
  console.log('Backend URL: http://localhost:3000');
});

afterAll(async () => {
  console.log('✅ E2E Test Suite completed');
});

// Increase timeout for all tests
jest.setTimeout(60000);