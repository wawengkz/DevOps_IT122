module.exports = {
  extends: ["next/core-web-vitals"],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Code Quality Rules (warnings for easier adoption)
    "no-unused-vars": "warn",
    "no-console": "off", // Allow console logs for development
    "no-debugger": "error",
    "no-duplicate-imports": "warn",
    "react-hooks/exhaustive-deps": "warn", // Make useEffect deps warnings instead of errors
  },
  ignorePatterns: ["node_modules/", ".next/", "out/", "build/", "dist/"],
};
