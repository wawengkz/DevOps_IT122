beforeAll(() => {
  console.log('🧪 Starting API and Database Tests...');
});

afterAll(() => {
  console.log('✅ Tests completed');
});

// Global test timeout
jest.setTimeout(30000);
