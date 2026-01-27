import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

export async function hashPasswordScrypt(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const buf = (await scrypt(plain, salt, 32)) as Buffer;
  return `scrypt$${salt.toString('base64')}$${buf.toString('base64')}`;
}

export async function verifyPassword(
  hashed: string,
  plain: string
): Promise<boolean> {
  if (hashed.startsWith('scrypt$')) {
    const parts = hashed.split('$');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'base64');
    const expect = Buffer.from(parts[2], 'base64');
    const buf = (await scrypt(plain, salt, expect.length)) as Buffer;
    return timingSafeEqual(buf, expect);
  }
  return hashed === plain;
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a[i] ^ b[i];
  }
  return r === 0;
}
