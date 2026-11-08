// npm run dev:memory : starts a throwaway in-memory MongoDB, seeds it, then starts the API.
// Nothing is saved after you stop it, and your real MONGODB_URI is never used.
import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
const env = { ...process.env, MONGODB_URI: `${mongod.getUri()}global_edutech`, NODE_ENV: 'development' };
const run = (args) => new Promise((resolve) => spawn(process.execPath, args, { env, stdio: 'inherit' }).on('exit', resolve));

await run(['--env-file-if-exists=.env', 'scripts/seed.js']);
const api = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/index.js'], { env, stdio: 'inherit' });
const stop = async () => { api.kill(); await mongod.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
api.on('exit', stop);
