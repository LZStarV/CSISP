import {
  signToken as sdkSignToken,
  verifyToken as sdkVerifyToken,
  parseDurationToSeconds,
} from '@csisp/auth/server';

import { config } from '@/src/server/config';

export function signToken(payload: Record<string, any>) {
  return sdkSignToken(payload, config.auth.jwtSecret, {
    expiresIn: parseDurationToSeconds(config.auth.jwtExpiresIn, 7200),
  });
}

export function verifyToken(token: string) {
  return sdkVerifyToken(token, config.auth.jwtSecret);
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
