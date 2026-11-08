import os from 'node:os';
import { JobLock } from '../models/System.js';

const INSTANCE = `${os.hostname()}:${process.pid}`;

// Atomic lock: only matches an expired lock; if the lock is held the upsert hits the unique index and we lose the race
export async function acquireLock(name, ttlMs = 15 * 60 * 1000) {
  try {
    await JobLock.findOneAndUpdate(
      { name, lockedUntil: { $lt: new Date() } },
      { $set: { lockedUntil: new Date(Date.now() + ttlMs), lockedBy: INSTANCE } },
      { upsert: true, returnDocument: 'after' },
    );
    return true;
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
}

export async function releaseLock(name) {
  await JobLock.updateOne({ name, lockedBy: INSTANCE }, { $set: { lockedUntil: new Date(0) } });
}
