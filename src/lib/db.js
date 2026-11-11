import pg from 'pg';

const { Pool } = pg;

function sslConfiguration() {
  const mode = process.env.DATABASE_SSL || 'require';
  if (mode === 'disable') return false;
  return { rejectUnauthorized: mode !== 'no-verify' };
}

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!globalThis.__bbOpticalPool) {
    globalThis.__bbOpticalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfiguration(),
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      application_name: 'bb-optical-vercel'
    });
  }
  return globalThis.__bbOpticalPool;
}
