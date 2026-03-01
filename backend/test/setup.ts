import dotenv from "dotenv";
import path from "path";

// Load .env.test so DATABASE_URL points to test DB for the whole test run
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });
// Ensure DATABASE_URL is set for Prisma (use TEST_DATABASE_URL if present)
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
