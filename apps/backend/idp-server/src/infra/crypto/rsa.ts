import { generateKeyPairSync } from 'crypto';

let pub: string | null = null;

export function getPublicKey(): string {
  if (pub) return pub;
  const { publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  pub = publicKey;
  return pub;
}
