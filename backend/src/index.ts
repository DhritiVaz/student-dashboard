import dotenv from "dotenv";
import path from "path";

// Force development .env only
dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

import app from "./app";

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});