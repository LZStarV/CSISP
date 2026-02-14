import { requireEnv } from '@csisp/utils';
import mongoose from 'mongoose';

let connected = false;

export async function getMongoose() {
  if (connected) return mongoose;
  const uri = requireEnv('MONGODB_URI');
  const dbName = requireEnv('MONGODB_DB');
  await mongoose.connect(uri, { dbName });
  connected = true;
  return mongoose;
}

export async function health(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  clients?: number;
  readyState?: number;
}> {
  try {
    const ms = await getMongoose();
    const start = Date.now();
    if (!ms.connection?.db) {
      return {
        ok: false,
        latencyMs: null,
        clients: 0,
        readyState: ms.connection?.readyState,
      };
    }
    await ms.connection.db.admin().ping();
    const latency = Date.now() - start;
    const clients = (ms.connections?.length as number) || 1;
    return {
      ok: true,
      latencyMs: latency,
      clients,
      readyState: ms.connection.readyState,
    };
  } catch {
    return { ok: false, latencyMs: null };
  }
}
