export type DbConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export function getDbConfig(): DbConfig {
  const url = process.env.IDP_DB_URL || process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    const host = u.hostname;
    const port = Number(u.port || 5432);
    const database = (u.pathname || '').replace(/^\//, '') || 'postgres';
    const username = decodeURIComponent(u.username || 'postgres');
    const password = decodeURIComponent(u.password || '');
    return { host, port, database, username, password };
  }

  const host = process.env.DB_HOST || 'localhost';
  const portRaw = process.env.DB_PORT || '5433';
  const database = process.env.DB_NAME || 'csisp';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT value: ${portRaw}`);
  }

  return { host, port, database, username, password };
}
