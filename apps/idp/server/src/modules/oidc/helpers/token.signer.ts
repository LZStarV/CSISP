import crypto from 'crypto';

import { signToken, parseDurationToSeconds } from '@csisp/auth/server';

export interface SignerOptions {
  issuer: string;
  expiresIn: string;
  refreshExpiresIn: string;
  kekSecret: string;
}

/**
 * OIDC 令牌签发助手
 * 负责解密密钥与执行 JWT 签名逻辑
 */
export class OidcTokenSigner {
  constructor(private readonly opts: SignerOptions) {}

  /**
   * 解密私钥 (AES-256-GCM)
   */
  decryptPrivatePem(enc: Buffer): string {
    const key = crypto
      .createHash('sha256')
      .update(this.opts.kekSecret)
      .digest();
    const iv = enc.subarray(0, 12);
    const tag = enc.subarray(12, 28);
    const data = enc.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return out.toString();
  }

  /**
   * 签发 OIDC 令牌集合 (Access, ID, Refresh)
   */
  sign(params: {
    sub: string;
    clientId: string;
    kid: string;
    privatePem: string;
    nonce?: string;
    acr?: string;
    amr?: string[];
    preferredUsername?: string;
    name?: string;
    roles?: string[];
    scope?: string;
  }) {
    const accessExp = parseDurationToSeconds(this.opts.expiresIn, 3600);
    const refreshExp = parseDurationToSeconds(
      this.opts.refreshExpiresIn,
      604800
    );

    const access_token = signToken(
      {
        iss: this.opts.issuer,
        aud: params.clientId,
        scope: params.scope || 'openid',
        sub: params.sub,
      },
      params.privatePem,
      { algorithm: 'RS256', expiresIn: accessExp, keyid: params.kid }
    );

    const id_token = signToken(
      {
        iss: this.opts.issuer,
        aud: params.clientId,
        sub: params.sub,
        nonce: params.nonce ?? crypto.randomUUID(),
        acr: params.acr,
        amr: params.amr,
        preferred_username: params.preferredUsername,
        name: params.name,
        roles: params.roles || [],
      },
      params.privatePem,
      { algorithm: 'RS256', expiresIn: accessExp, keyid: params.kid }
    );

    const refresh_token = signToken(
      { aud: params.clientId, sub: params.sub, t: 'refresh' },
      params.privatePem,
      { algorithm: 'RS256', expiresIn: refreshExp, keyid: params.kid }
    );

    return {
      access_token,
      id_token,
      refresh_token,
      expires_in: accessExp,
    };
  }
}
