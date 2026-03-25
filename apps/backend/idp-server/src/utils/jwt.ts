import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface TokenPayload extends Record<string, any> {
  sub?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

export function signToken(
  payload: TokenPayload,
  secretOrPrivateKey: string,
  options: SignOptions = {}
): string {
  return jwt.sign(payload, secretOrPrivateKey, options);
}

export function verifyToken<T = TokenPayload>(
  token: string,
  secretOrPublicKey: string,
  options: VerifyOptions = {}
): T {
  return jwt.verify(token, secretOrPublicKey, options) as T;
}

export function decodeToken<T = TokenPayload>(token: string): T | null {
  return jwt.decode(token) as T | null;
}

export function parseDurationToSeconds(
  input: string | number | undefined,
  fallback: number
): number {
  if (!input && input !== 0) return fallback;
  if (typeof input === 'number') return input;
  const m = String(input)
    .trim()
    .match(/^(\d+)([smhd])$/);
  if (!m) {
    const n = Number(input);
    return Number.isFinite(n) ? n : fallback;
  }
  const val = Number(m[1]);
  const unit = m[2];
  switch (unit) {
    case 's':
      return val;
    case 'm':
      return val * 60;
    case 'h':
      return val * 3600;
    case 'd':
      return val * 86400;
    default:
      return fallback;
  }
}
