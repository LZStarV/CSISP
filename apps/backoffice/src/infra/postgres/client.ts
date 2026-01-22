import { Sequelize } from 'sequelize';

import { getDatabaseUrl } from '@/src/server/config/env';

let sequelize: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelize) return sequelize;
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  sequelize = new Sequelize(url, { dialect: 'postgres', logging: false });
  return sequelize;
}

export async function health(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}> {
  try {
    const sq = getSequelize();
    const start = Date.now();
    await sq.authenticate();
    const latency = Date.now() - start;
    return { ok: true, latencyMs: latency };
  } catch (e: any) {
    return { ok: false, latencyMs: null, error: e?.message || 'error' };
  }
}
