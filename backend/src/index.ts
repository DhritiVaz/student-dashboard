import fs from "fs";
import path from "path";
import dotenv from "dotenv";

/** Resolve backend/.env for both `tsx src/index.ts` and compiled `dist/.../index.js`. */
function resolveBackendEnvPath(): string {
  const candidates = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend", ".env"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

dotenv.config({ path: resolveBackendEnvPath() });

import app from "./app";

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
