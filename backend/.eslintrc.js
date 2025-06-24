module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // Code Quality Rules only (no style rules)
    "no-unused-vars": "warn",
    "no-console": "off", // Allow console in backend
    "no-debugger": "error",
    "no-duplicate-imports": "warn",
    "no-unreachable": "error",
    "no-useless-escape": "warn", // Make regex escapes warnings instead of errors
    // TypeScript specific rules (only apply if using TS)
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"

    // Removed all style rules - let Prettier handle formatting
  },
  ignorePatterns: ["node_modules/", "dist/", "coverage/"],
  // Override for TypeScript files
  overrides: [
    {
      files: ["**/*.ts"],
      rules: {
        "no-unused-vars": "off", // Turn off base rule for TS files
        "@typescript-eslint/no-unused-vars": "warn"
      }
    }
  ]
};