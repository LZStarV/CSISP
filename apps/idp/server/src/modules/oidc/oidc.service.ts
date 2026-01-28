import crypto from 'crypto';

import { Injectable, BadRequestException } from '@nestjs/common';

import { signRS256, parseDurationToSeconds } from '../../infra/crypto/jwt';
import { OidcClientModel } from '../../infra/postgres/models/oidc-client.model';
import { OidcKeyModel } from '../../infra/postgres/models/oidc-key.model';
import { RefreshTokenModel } from '../../infra/postgres/models/refresh-token.model';
import { UserModel } from '../../infra/postgres/models/user.model';
import {
  get as redisGet,
  set as redisSet,
  del as redisDel,
} from '../../infra/redis';

function baseUrl(): string {
  const port = Number(process.env.PORT ?? 4001);
  const host = process.env.IDP_BASE_URL ?? `http://localhost:${port}`;
  return `${host}/api/idp`;
}

@Injectable()
export class OidcService {
  getConfiguration() {
    const issuer = baseUrl();
    return {
      issuer,
      authorization_endpoint: `${issuer}/oidc/authorize`,
      token_endpoint: `${issuer}/oidc/token`,
      userinfo_endpoint: `${issuer}/oidc/userinfo`,
      jwks_uri: `${issuer}/oidc/jwks.json`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      response_modes_supported: ['query'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      claims_supported: [
        'sub',
        'name',
        'preferred_username',
        'email',
        'acr',
        'amr',
        'nonce',
      ],
    };
  }

  private decryptPrivatePem(enc: Buffer): string {
    const kek = process.env.OIDC_KEK_SECRET || 'dev-kek';
    const key = crypto.createHash('sha256').update(kek).digest();
    const iv = enc.subarray(0, 12);
    const tag = enc.subarray(12, 28);
    const data = enc.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return out.toString();
  }

  async getJwks() {
    const rows = await OidcKeyModel.findAll({
      attributes: ['kid', 'kty', 'alg', 'use', 'public_pem', 'status'],
    });
    const keys = rows
      .filter(r => r.status === 'active' || r.status === 'retired')
      .map(r => {
        const pub = crypto.createPublicKey(r.public_pem);
        const jwk: any = pub.export({ format: 'jwk' });
        return {
          kid: r.kid as string,
          kty: (r.kty as string) || jwk.kty || 'RSA',
          alg: (r.alg as string) || 'RS256',
          use: (r.use as string) || 'sig',
          n: jwk.n,
          e: jwk.e,
        };
      });
    return { keys };
  }

  async startAuthorization(params: Record<string, string>) {
    const {
      client_id,
      redirect_uri,
      response_type,
      state,
      code_challenge,
      code_challenge_method,
      scope,
      nonce,
    } = params;
    if (!client_id || !redirect_uri || response_type !== 'code' || !state) {
      throw new BadRequestException('Invalid authorization request');
    }
    if (!code_challenge || code_challenge_method !== 'S256') {
      throw new BadRequestException('PKCE S256 required');
    }
    const client = await OidcClientModel.findOne({
      where: { client_id },
      attributes: ['allowed_redirect_uris', 'status'],
    });
    if (!client || client.status !== 'active') {
      throw new BadRequestException('Unknown or inactive client');
    }
    let whitelist: string[] = [];
    const ar = client.allowed_redirect_uris as unknown as string[] | string;
    if (Array.isArray(ar)) {
      whitelist = (ar as any[]).filter((x: any) => typeof x === 'string');
    } else if (typeof ar === 'string') {
      try {
        const parsed = JSON.parse(ar);
        if (Array.isArray(parsed)) {
          whitelist = parsed.filter((x: any) => typeof x === 'string');
        }
      } catch {}
    }
    if (!whitelist.includes(redirect_uri)) {
      throw new BadRequestException('redirect_uri not allowed');
    }
    const scopeStr =
      typeof scope === 'string' && scope.length > 0 ? scope : 'openid';
    const key = `oidc:authreq:${state}`;
    await redisSet(
      key,
      JSON.stringify({
        client_id,
        redirect_uri,
        response_type,
        state,
        code_challenge,
        code_challenge_method,
        scope: scopeStr,
        nonce,
        ts: Date.now(),
      }),
      600
    );
    return { ok: true, state };
  }

  async exchangeToken(params: Record<string, string>) {
    const {
      client_id,
      code_verifier,
      code,
      redirect_uri,
      grant_type,
      refresh_token,
    } = params;
    if (!client_id || !grant_type)
      throw new BadRequestException('Invalid token request');
    if (grant_type === 'authorization_code') {
      if (!code_verifier || !code || !redirect_uri)
        throw new BadRequestException('Invalid token request');
      const auth = await redisGet(`oidc:code:${code}`);
      if (!auth) throw new BadRequestException('Invalid or expired code');
      const authObj = JSON.parse(auth);
      if (
        authObj.client_id !== client_id ||
        authObj.redirect_uri !== redirect_uri
      ) {
        throw new BadRequestException('Mismatched client or redirect');
      }
      const expectedChallenge = authObj.code_challenge as string;
      const calc = crypto
        .createHash('sha256')
        .update(code_verifier)
        .digest('base64url');
      if (calc !== expectedChallenge)
        throw new BadRequestException('Invalid code_verifier');
      await redisDel(`oidc:code:${code}`);
      const sub = authObj.sub;
      const acr = authObj.acr;
      const amr = authObj.amr;
      const preferred = sub;
      const scopeStr = authObj.scope || 'openid';
      return this.issueTokens(
        client_id,
        sub,
        authObj.nonce,
        acr,
        amr,
        preferred,
        scopeStr
      );
    }
    if (grant_type === 'refresh_token') {
      if (!refresh_token)
        throw new BadRequestException('Missing refresh_token');
      const rtHash = crypto
        .createHash('sha256')
        .update(refresh_token)
        .digest('hex');
      const cur = await RefreshTokenModel.findOne({
        where: { rt_hash: rtHash },
        attributes: ['id', 'status', 'sub_hash'],
      });
      if (!cur) throw new BadRequestException('Invalid refresh token');
      if (cur.status !== 'active') {
        await RefreshTokenModel.update(
          { status: 'revoked' },
          { where: { client_id, sub_hash: cur.sub_hash as string } }
        );
        throw new BadRequestException('Refresh token reused or revoked');
      }
      await RefreshTokenModel.update(
        { status: 'rotated', last_used_at: new Date() },
        { where: { id: cur.id as number } }
      );
      const sub = cur.sub_hash as string;
      const issued = await this.issueTokens(
        client_id,
        sub,
        undefined,
        undefined,
        undefined,
        sub,
        'openid'
      );
      const newHash = crypto
        .createHash('sha256')
        .update(issued.refresh_token as string)
        .digest('hex');
      await RefreshTokenModel.create({
        client_id,
        sub_hash: sub,
        rt_hash: newHash,
        status: 'active',
        prev_id: cur.id as number,
        created_at: new Date(),
      });
      return issued;
    }
    throw new BadRequestException('Unsupported grant_type');
  }

  private async issueTokens(
    client_id: string,
    sub: string,
    nonce?: string,
    acr?: string,
    amr?: string[],
    preferred_username?: string,
    scope?: string
  ) {
    const keyRow = await OidcKeyModel.findOne({
      where: { status: 'active' },
      attributes: ['kid', 'public_pem', 'private_pem_enc'],
    });
    if (!keyRow) throw new BadRequestException('No active signing key');
    const privatePem = this.decryptPrivatePem(
      Buffer.from(keyRow.private_pem_enc as any)
    );
    const kid = keyRow.kid as string;
    const accessExp = parseDurationToSeconds(
      process.env.JWT_EXPIRES_IN || '1h',
      3600
    );
    const refreshExp = parseDurationToSeconds(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      604800
    );
    const access_token = signRS256(
      { iss: baseUrl(), aud: client_id, scope: scope || 'openid', sub },
      privatePem,
      accessExp,
      kid
    );
    const id_token = signRS256(
      {
        iss: baseUrl(),
        aud: client_id,
        sub,
        nonce: nonce ?? crypto.randomUUID(),
        acr: acr,
        amr: amr,
        preferred_username: preferred_username,
      },
      privatePem,
      accessExp,
      kid
    );
    const refresh_token = signRS256(
      { aud: client_id, sub, t: 'refresh' },
      privatePem,
      refreshExp,
      kid
    );
    // 记录 refresh token
    const rtHash = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');
    await RefreshTokenModel.create({
      client_id,
      sub_hash: sub,
      rt_hash: rtHash,
      status: 'active',
      created_at: new Date(),
    });
    return {
      access_token,
      id_token,
      refresh_token,
      token_type: 'bearer',
      expires_in: accessExp,
    };
  }

  async revokeToken(token: string) {
    const rtHash = crypto.createHash('sha256').update(token).digest('hex');
    const cur = await RefreshTokenModel.findOne({
      where: { rt_hash: rtHash },
      attributes: ['id'],
    });
    if (!cur) return { ok: true };
    await RefreshTokenModel.update(
      { status: 'revoked' },
      { where: { id: cur.id as number } }
    );
    return { ok: true };
  }

  async userinfo(token: string) {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) throw new BadRequestException('Invalid token');
    const header = JSON.parse(
      Buffer.from(h.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const kid = header.kid;
    const row = await OidcKeyModel.findOne({
      where: { kid },
      attributes: ['public_pem'],
    });
    if (!row) throw new BadRequestException('Unknown key');
    const pubPem = row.public_pem as string;
    const data = `${h}.${p}`;
    const sig = Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    const ok = verifier.verify(pubPem, sig);
    if (!ok) throw new BadRequestException('Invalid signature');
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const sub = payload.sub;
    const scope = payload.scope as string | undefined;
    const idNum = Number(sub);
    const user =
      Number.isFinite(idNum) && idNum > 0
        ? await UserModel.findOne({
            where: { id: idNum },
            attributes: ['id', 'username', 'real_name', 'email'],
          })
        : null;
    const claims: any = { sub };
    if (user) {
      claims.preferred_username = (user as any).username;
      if (scope && scope.includes('profile')) {
        claims.name = (user as any).real_name;
      }
      if (scope && scope.includes('email')) {
        claims.email = (user as any).email ?? null;
      }
    } else {
      claims.preferred_username = sub;
      if (scope && scope.includes('email')) {
        claims.email = null;
      }
    }
    if (payload.acr) claims.acr = payload.acr;
    if (payload.amr) claims.amr = payload.amr;
    return claims;
  }

  async backchannelLogout(logout_token: string) {
    const [h, p, s] = logout_token.split('.');
    if (!h || !p || !s) throw new BadRequestException('Invalid token');
    const header = JSON.parse(
      Buffer.from(h.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const kid = header.kid;
    const row = await OidcKeyModel.findOne({
      where: { kid },
      attributes: ['public_pem'],
    });
    if (!row) throw new BadRequestException('Unknown key');
    const pubPem = row.public_pem as string;
    const data = `${h}.${p}`;
    const sig = Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    const ok = verifier.verify(pubPem, sig);
    if (!ok) throw new BadRequestException('Invalid signature');
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const sub = payload.sub;
    await RefreshTokenModel.update(
      { status: 'revoked' },
      { where: { sub_hash: sub } }
    );
    return { ok: true };
  }
}
