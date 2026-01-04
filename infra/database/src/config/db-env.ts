export type DbConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function getDbConfig(): DbConfig {
  const host = requireEnv('DB_HOST', 'localhost');
  const portRaw = requireEnv('DB_PORT', '5433');
  const database = requireEnv('DB_NAME', 'csisp');
  const username = requireEnv('DB_USER', 'postgres');
  const password = requireEnv('DB_PASSWORD', 'postgres');

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT value: ${portRaw}`);
  }

  return { host, port, database, username, password };
}
