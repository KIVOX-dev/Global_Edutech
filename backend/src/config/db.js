import mongoose from 'mongoose';
import config from './env.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);

export const dbReady = () => mongoose.connection.readyState === 1;

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
      logger.error({ err: err.message, attempt }, 'MongoDB connection failed');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  return false;
}

export const disconnectDb = () => mongoose.disconnect();
