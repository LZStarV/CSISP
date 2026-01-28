import { createHmac, createSign } from 'crypto';

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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

export function signHS256(
  payload: Record<string, any>,
  secret: string,
  expiresInSec: number
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(
    Buffer.from(JSON.stringify(body))
  )}`;
  const sig = createHmac('sha256', secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function signRS256(
  payload: Record<string, any>,
  privatePem: string,
  expiresInSec: number,
  kid?: string
): string {
  const header = kid
    ? { alg: 'RS256', typ: 'JWT', kid }
    : { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(
    Buffer.from(JSON.stringify(body))
  )}`;
  const signer = createSign('RSA-SHA256');
  signer.update(data);
  const sig = signer.sign(privatePem);
  return `${data}.${b64url(sig)}`;
}
