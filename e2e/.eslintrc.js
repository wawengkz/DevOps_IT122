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
    // Code Quality Rules only (no style rules for tests)
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console in tests
    'no-debugger': 'error',
    'no-duplicate-imports': 'warn',
    'no-useless-escape': 'warn'  // Make regex escapes warnings
    
    // Removed all style rules - let Prettier handle formatting
  },
  ignorePatterns: [
    'node_modules/'
  ]
};