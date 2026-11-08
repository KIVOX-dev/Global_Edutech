// Copies the static Next.js export (frontend/out) into backend/public, which Express serves.
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'frontend', 'out');
const to = path.join(root, 'backend', 'public');
if (!existsSync(from)) throw new Error('frontend/out not found: run the static frontend build first');
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log('Copied frontend/out -> backend/public');
