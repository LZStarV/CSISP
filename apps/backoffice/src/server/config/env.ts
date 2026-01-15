export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'default-secret';
}

export const jwtExpiresIn = '2h';

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || '';
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
