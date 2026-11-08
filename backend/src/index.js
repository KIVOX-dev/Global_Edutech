import mongoose from 'mongoose';
import config from './config/env.js';
import logger from './config/logger.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './createApp.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';

async function main() {
  if (config.notConfigured.length) {
    logger.warn(`PLACEHOLDER MODE: these services are not configured and will be skipped:\n  - ${config.notConfigured.join('\n  - ')}`);
  }

  try {
    await connectDb();
  } catch (err) {
    if (config.isProd) { logger.fatal({ err: err.message }, 'Cannot start without a database in production'); process.exit(1); }
    logger.error('Continuing without a database (development only)');
  }

  const app = createApp();
  // AppSail injects X_ZOHO_CATALYST_LISTEN_PORT; bind to all interfaces
  const server = app.listen(config.port, config.host, () => logger.info(`API listening on http://${config.host}:${config.port} (${config.env})`));

  if (mongoose.connection.readyState === 1) await startScheduler().catch((err) => logger.error({ err: err.message }, 'Scheduler failed to start'));

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    logger.info({ signal }, 'Shutting down');
    stopScheduler();
    server.close(async () => {
      await disconnectDb().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => logger.error({ err: String(err?.message || err) }, 'Unhandled rejection'));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
