import { NextResponse } from 'next/server';

import { health as mongoHealth } from '@/src/infra/mongo';
import { health as pgHealth } from '@/src/infra/postgres';
import { health as redisHealth } from '@/src/infra/redis';

export async function GET() {
  // TODO: restrict to admin-only access later
  const [postgres, redis, mongo] = await Promise.all([
    pgHealth(),
    redisHealth(),
    mongoHealth(),
  ]);
  return NextResponse.json({ postgres, redis, mongo }, { status: 200 });
}
