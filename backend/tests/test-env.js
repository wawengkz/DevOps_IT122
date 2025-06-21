// Test environment configuration
process.env.NODE_ENV = 'test';

// Use different MongoDB URI for different environments
if (process.env.GITHUB_ACTIONS) {
  // GitHub Actions environment - use local MongoDB
  process.env.MONGODB_URI = 'mongodb://localhost:27017/brainbytes_test';
} else if (process.env.DOCKER_ENV) {
  // Docker environment - use docker service name
  process.env.MONGODB_URI = 'mongodb://mongo:27017/brainbytes_test';
} else {
  // Local development - use localhost
  process.env.MONGODB_URI = 'mongodb://localhost:27017/brainbytes_test';
}

// Mock Hugging Face token if not provided
if (!process.env.HUGGINGFACE_TOKEN) {
  process.env.HUGGINGFACE_TOKEN = 'test_token_mock';
}

console.log('Test environment configured:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  GITHUB_ACTIONS: process.env.GITHUB_ACTIONS ? 'true' : 'false'
});