module.exports = {
  extends: ["next/core-web-vitals", "eslint:recommended"],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react"],
  rules: {
    // Code Quality Rules (warnings for easier adoption)
    "no-unused-vars": "warn",
    "no-console": "off", // Allow console logs for development
    "no-debugger": "error",
    "no-duplicate-imports": "warn",
    "react-hooks/exhaustive-deps": "warn", // Make useEffect deps warnings instead of errors
    "react/prop-types": "off", // Turn off prop-types as we might use TypeScript
    "react/react-in-jsx-scope": "off", // Not needed in Next.js
    // TypeScript specific rules (only apply if using TS)
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  ignorePatterns: ["node_modules/", ".next/", "out/", "build/", "dist/"],
  // Override for TypeScript files
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "no-unused-vars": "off", // Turn off base rule for TS files
        "@typescript-eslint/no-unused-vars": "warn"
      }
    }
  ]
};