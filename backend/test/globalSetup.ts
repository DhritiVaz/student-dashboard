import { execSync } from "child_process";
import path from "path";

/**
 * Load .env.test and reset the test database before any tests run.
 */
export default async function globalSetup() {
  // Load test env (dotenv loads from .env by default; we need .env.test)
  const dotenv = await import("dotenv");
  dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

  const databaseUrl =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL or DATABASE_URL must be set in .env.test"
    );
  }

  process.env.DATABASE_URL = databaseUrl;

  // Reset database: drop, recreate, push current schema (matches schema.prisma)
  execSync("npx prisma db push --force-reset", {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}
