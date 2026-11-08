import dns from 'node:dns';
import mongoose from 'mongoose';
import config from './env.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);

export const dbReady = () => mongoose.connection.readyState === 1;

let dnsFallbackUsed = false;

export async function connectDb({ retries = 5, delayMs = 2000 } = {}) {
  if (!config.services.mongodb) {
    logger.warn('MONGODB_URI is a placeholder: database features are disabled');
    return false;
  }
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 });
      logger.info('MongoDB connected');
      return true;
    } catch (err) {
      // Some networks / routers refuse the DNS SRV lookup that mongodb+srv:// needs (querySrv ECONNREFUSED).
      // Fall back once to public DNS resolvers and retry straight away.
      if (/querySrv/.test(err.message) && !dnsFallbackUsed) {
        dnsFallbackUsed = true;
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        logger.warn('SRV lookup failed with the system DNS; retrying with public DNS (8.8.8.8, 1.1.1.1)');
        attempt -= 1;
        continue;
      }
      logger.error({ err: err.message, attempt }, 'MongoDB connection failed');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  return false;
}

export const disconnectDb = () => mongoose.disconnect();
