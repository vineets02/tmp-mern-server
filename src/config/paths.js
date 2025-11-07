// server/src/config/paths.js
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Render, prefer a Persistent Disk mounted at /data
// You can override by setting UPLOAD_DIR in env.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.RENDER ? "/data/uploads" : path.join(__dirname, "..", "uploads"));

// make sure it exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
