import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

// 定义 JWT 令牌有效载荷接口
export interface TokenPayload extends Record<string, any> {
  sub?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

// 生成 JWT 令牌
export function signToken(
  payload: TokenPayload,
  secretOrPrivateKey: string,
  options: SignOptions = {}
): string {
  return jwt.sign(payload, secretOrPrivateKey, options);
}

// 验证 JWT 令牌
export function verifyToken<T = TokenPayload>(
  token: string,
  secretOrPublicKey: string,
  options: VerifyOptions = {}
): T {
  return jwt.verify(token, secretOrPublicKey, options) as T;
}

// 解码 JWT 令牌
export function decodeToken<T = TokenPayload>(token: string): T | null {
  return jwt.decode(token) as T | null;
}

// 解析时间字符串为秒数
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
