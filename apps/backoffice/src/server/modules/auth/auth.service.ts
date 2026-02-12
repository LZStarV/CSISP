import {
  signToken as sdkSignToken,
  verifyToken as sdkVerifyToken,
} from '@csisp/auth/server';

import { getJwtSecret, jwtExpiresIn } from '@/src/server/config/env';

export function signToken(payload: Record<string, any>) {
  return sdkSignToken(payload, getJwtSecret(), { expiresIn: jwtExpiresIn });
}

export function verifyToken(token: string) {
  return sdkVerifyToken(token, getJwtSecret());
}

export function requireAdmin(ctx: Record<string, any>) {
  const roles: string[] = ctx.state?.user?.roles ?? [];
  const ok = Array.isArray(roles) && roles.includes('admin');
  if (!ok) {
    const err = new Error('Forbidden: admin only');
    (err as any).code = -32602;
    throw err;
  }
}
