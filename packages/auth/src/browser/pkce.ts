// 生成随机字符串
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

// 生成 code_challenge 从 code_verifier
export async function generateChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  const b64 = btoa(String.fromCharCode(...arr));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 生成 PKCE 凭证对
export async function generatePKCE() {
  const verifier = generateRandomString(64);
  const challenge = await generateChallenge(verifier);
  return { verifier, challenge };
}

// 生成随机 State
export function generateState() {
  return generateRandomString(32);
}
