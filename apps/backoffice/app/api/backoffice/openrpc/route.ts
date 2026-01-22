import { NextResponse } from 'next/server';

import { withAuth } from '@/src/server/middleware/jwtAuth';
import { requireAdmin } from '@/src/server/middleware/roles';
import { buildOpenRPC } from '@/src/server/modules';

export async function GET(req: Request) {
  const ctx: Record<string, any> = { headers: req.headers };
  withAuth(ctx);
  requireAdmin(ctx);
  const doc = buildOpenRPC();
  return NextResponse.json(doc, { status: 200 });
}
