// Runs before any module is imported: the config loader reads these values once.
process.env.NODE_ENV = 'test';
// Real-looking so the DB counts as configured; tests connect to mongodb-memory-server instead
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ge_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789-0123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789-0123456789';
process.env.APP_URL = 'http://localhost:5173';
for (const k of ['B2_KEY_ID', 'B2_APPLICATION_KEY', 'B2_BUCKET', 'BREVO_API_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) process.env[k] = `your_${k}`;
