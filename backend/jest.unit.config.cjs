/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/parseVtopMarks.test.ts", "**/parseVtopGradeHistory.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: [],
  globalSetup: undefined,
  testTimeout: 10000,
};
