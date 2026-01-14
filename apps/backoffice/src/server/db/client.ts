import { Pool } from 'pg';
let pool: Pool | null = null;
export function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  pool = new Pool({ connectionString: url });
  return pool;
}
