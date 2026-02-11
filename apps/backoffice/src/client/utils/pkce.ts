/**
 * PKCE (Proof Key for Code Exchange) 工具类
 * 用于生成 OIDC 授权码流程所需的 code_verifier 和 code_challenge
 */

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * 将 ArrayBuffer 转换为 Base64URL 编码
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 生成 PKCE 凭证对
 */
export async function generatePKCE() {
  const verifier = generateRandomString(64);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(hash);

  return { verifier, challenge };
}

/**
 * 生成随机 State
 */
export function generateState() {
  return generateRandomString(32);
}
