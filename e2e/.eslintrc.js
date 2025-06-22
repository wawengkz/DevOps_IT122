module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Code Quality Rules
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console in tests
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    
    // Style Rules
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never']
  },
  ignorePatterns: [
    'node_modules/'
  ]
};