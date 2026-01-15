import jwt from 'jsonwebtoken';
import { getJwtSecret, jwtExpiresIn } from '@/src/server/config/env';

export function sign(payload: Record<string, any>) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: jwtExpiresIn });
}
export function verify(token: string) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as any;
}
