export const isProd = process.env.NODE_ENV === 'production';

// Dev-only fallbacks; in production these must come from the environment.
export const JWT_SECRET = process.env.JWT_SECRET || (isProd ? '' : 'dev-only-insecure-secret');
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || (isProd ? '' : 'admin');
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? '' : 'globaledutech-admin');
