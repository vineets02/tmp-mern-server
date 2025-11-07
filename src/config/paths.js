// server/src/config/paths.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Prefer env var; on Render set UPLOAD_DIR=/data/uploads (with a Disk attached).
// Locally, this will default to project ./uploads
const FALLBACK_DIR = path.join(__dirname, '..', '..', '/uploads');
const CANDIDATE = process.env.UPLOAD_DIR || FALLBACK_DIR;

// ensure a directory exists *if we have permission*
function ensureDirSafe(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    // quick write check
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch {
    // If we can’t write to requested dir (e.g. /data without a Disk),
    // fall back to a local, writable folder inside the repo.
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    return FALLBACK_DIR;
  }
}

export const UPLOAD_DIR = ensureDirSafe(CANDIDATE);
export const PUBLIC_UPLOAD_ROUTE = '/uploads';
