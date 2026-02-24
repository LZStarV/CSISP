export type DbConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export function getDbConfig(): DbConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing environment variable: DATABASE_URL');
  }
  const u = new URL(url);
  const host = u.hostname;
  const port = Number(u.port || 5432);
  const database = (u.pathname || '').replace(/^\//, '');
  const username = decodeURIComponent(u.username || '');
  const password = decodeURIComponent(u.password || '');
  if (!database) {
    throw new Error('Invalid DATABASE_URL: database is empty');
  }
  if (!username) {
    throw new Error('Invalid DATABASE_URL: username is empty');
  }
  return { host, port, database, username, password };
}
