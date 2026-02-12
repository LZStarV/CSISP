/**
 * PKCE (Proof Key for Code Exchange) Utilities for Browser
 */

export function generateRandomString(length = 64): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function generateChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  const b64 = btoa(String.fromCharCode(...arr));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generatePKCE() {
  const verifier = generateRandomString(64);
  const challenge = await generateChallenge(verifier);
  return { verifier, challenge };
}

export function generateState() {
  return generateRandomString(32);
}
