import jwt from 'jsonwebtoken';
export function sign(payload: Record<string, any>) {
  const secret = process.env.JWT_SECRET || 'default-secret';
  return jwt.sign(payload, secret, { expiresIn: '2h' });
}
export function verify(token: string) {
  const secret = process.env.JWT_SECRET || 'default-secret';
  return jwt.verify(token, secret) as any;
}
