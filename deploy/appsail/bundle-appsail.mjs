// Builds ./appsail-build: the exact folder uploaded to Zoho Catalyst AppSail
// (server code + built frontend + production node_modules; AppSail does not run npm install for you).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = path.join(root, 'appsail-build');
const backend = path.join(root, 'backend');
if (!existsSync(path.join(backend, 'public', 'index.html'))) throw new Error('Run "npm run build" first (backend/public is missing)');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(path.join(backend, 'src'), path.join(out, 'src'), { recursive: true });
cpSync(path.join(backend, 'public'), path.join(out, 'public'), { recursive: true });
cpSync(path.join(backend, 'scripts'), path.join(out, 'scripts'), { recursive: true });
cpSync(path.join(backend, 'package.json'), path.join(out, 'package.json'));
cpSync(path.join(backend, 'package-lock.json'), path.join(out, 'package-lock.json'));

// Drop dev-only tooling from the deployed package.json, then install production deps only
const pkg = JSON.parse(readFileSync(path.join(out, 'package.json'), 'utf8'));
delete pkg.devDependencies;
pkg.scripts = { start: 'node src/index.js', seed: 'node scripts/seed.js' };
writeFileSync(path.join(out, 'package.json'), JSON.stringify(pkg, null, 2));
execSync('npm install --omit=dev --no-audit --no-fund', { cwd: out, stdio: 'inherit' });
console.log(`\nAppSail bundle ready: ${out}`);
