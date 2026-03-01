/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/controllers/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    // Relaxed for modules not yet fully tested; aim for 70% on auth/semesters/assignments
    global: {
      branches: 5,
      functions: 25,
      lines: 40,
      statements: 40,
    },
  },
  setupFiles: ["<rootDir>/test/setup.ts"],
  globalSetup: "<rootDir>/test/globalSetup.ts",
  testTimeout: 15000,
  maxWorkers: 1, // Run test files sequentially to avoid DB conflicts
};
