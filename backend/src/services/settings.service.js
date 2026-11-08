import { Setting, ReminderSetting } from '../models/System.js';

// Singleton upsert; two simultaneous first calls can race on the unique key, so retry the read once
async function singleton(Model) {
  const run = () => Model.findOneAndUpdate({ key: 'singleton' }, { $setOnInsert: { key: 'singleton' } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
  try {
    return await run();
  } catch (err) {
    if (err.code === 11000) return Model.findOne({ key: 'singleton' });
    throw err;
  }
}

export const getSettings = () => singleton(Setting);
export const getReminderSettings = () => singleton(ReminderSetting);
