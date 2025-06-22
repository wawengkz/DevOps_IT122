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
    // Code Quality Rules only (no style rules)
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console in backend
    'no-debugger': 'error',
    'no-duplicate-imports': 'warn',
    'no-unreachable': 'error',
    'no-useless-escape': 'warn'  // Make regex escapes warnings instead of errors
    
    // Removed all style rules - let Prettier handle formatting
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/'
  ]
};