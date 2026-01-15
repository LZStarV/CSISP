import { Pool } from 'pg';
import { getDatabaseUrl, isDatabaseConfigured } from '@/src/server/config/env';
let pool: Pool | null = null;
export function getPool() {
  if (pool) return pool;
  const url = getDatabaseUrl();
  if (!url) throw new Error('DATABASE_URL is not set');
  pool = new Pool({ connectionString: url });
  return pool;
}
export function isDbConfigured() {
  return isDatabaseConfigured();
}
