import crypto from 'crypto';

import {
  AuthorizationRequest,
  AuthorizationInitResult,
  TokenRequest,
  TokenResponse,
  JWK,
  JWKSet,
  UserInfo,
  RevocationResult,
  ClientInfo,
  Configuration,
} from '@csisp/idl/idp';
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
type TokenRefreshRequest = {
  grant_type: string;
  client_id: string;
  refresh_token: string;
};

@Injectable()
export class OidcService {
  /**
   * 获取 OIDC 发现配置（Well‑Known）
   * - issuer/authorization_endpoint/token_endpoint/userinfo/jwks_uri 等
   */
  getConfiguration(): Configuration {
    const issuer = baseUrl();
    return new Configuration({
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
    });
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

  /**
   * 获取用于验证签名的公钥集合（JWKS）
   * - 仅返回状态为 active/retired 的密钥
   */
  async getJwks(): Promise<JWKSet> {
    const rows = await OidcKeyModel.findAll({
      attributes: ['kid', 'kty', 'alg', 'use', 'public_pem', 'status'],
    });
    const keys = rows
      .filter(r => r.status === 'active' || r.status === 'retired')
      .map(r => {
        const pub = crypto.createPublicKey(r.public_pem);
        const jwk: any = pub.export({ format: 'jwk' });
        return new JWK({
          kid: r.kid as string,
          kty: (r.kty as string) || jwk.kty || 'RSA',
          alg: (r.alg as string) || 'RS256',
          use: (r.use as string) || 'sig',
          n: jwk.n,
          e: jwk.e,
        });
      });
    return new JWKSet({ keys });
  }

  /**
   * 发起授权请求（支持 PKCE S256）
   * - 校验 client/redirect_uri 白名单
   * - 在 Redis 记录授权态，返回 ok/state
   */
  async startAuthorization(
    params: AuthorizationRequest
  ): Promise<AuthorizationInitResult> {
    const {
      client_id,
      redirect_uri,
      response_type,
      state,
      code_challenge,
      code_challenge_method,
      scope,
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
        ts: Date.now(),
      }),
      600
    );
    return new AuthorizationInitResult({ ok: true, state });
  }

  /**
   * 令牌交换与刷新
   * - 授权码模式校验 code_verifier/redirect_uri 等并签发令牌
   * - 刷新模式进行 RT 轮换与防重放
   */
  async exchangeToken(
    params: TokenRequest | TokenRefreshRequest
  ): Promise<TokenResponse> {
    const { client_id, grant_type } = params;
    if (!client_id || !grant_type)
      throw new BadRequestException('Invalid token request');
    if (grant_type === 'authorization_code') {
      const { code_verifier, code, redirect_uri } = params as TokenRequest;
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
      const { refresh_token } = params as TokenRefreshRequest;
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

  /**
   * 签发 Access/ID/Refresh 三种令牌
   * - 使用当前激活的 RS256 私钥进行签名
   * - 记录 refresh_token（以哈希形式）
   */
  private async issueTokens(
    client_id: string,
    sub: string,
    nonce?: string,
    acr?: string,
    amr?: string[],
    preferred_username?: string,
    scope?: string
  ): Promise<TokenResponse> {
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
    return new TokenResponse({
      access_token,
      id_token,
      refresh_token,
      token_type: 'bearer',
      expires_in: accessExp,
    });
  }

  /**
   * 撤销 refresh_token
   * - 根据传入 token 的哈希匹配记录并标记为 revoked
   */
  async revokeToken(token: string): Promise<RevocationResult> {
    const rtHash = crypto.createHash('sha256').update(token).digest('hex');
    const cur = await RefreshTokenModel.findOne({
      where: { rt_hash: rtHash },
      attributes: ['id'],
    });
    if (!cur) return new RevocationResult({ ok: true });
    await RefreshTokenModel.update(
      { status: 'revoked' },
      { where: { id: cur.id as number } }
    );
    return new RevocationResult({ ok: true });
  }

  /**
   * 用户信息查询（验证 RS256 签名）
   * - 验证 access_token 的签名后返回用户声明
   */
  async userinfo(token: string): Promise<UserInfo> {
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
    return new UserInfo({
      sub: String(claims.sub),
      name: claims.name ?? undefined,
      preferred_username: claims.preferred_username ?? undefined,
      email: claims.email ?? undefined,
      phone: undefined,
      acr: claims.acr ?? undefined,
      amr: claims.amr ?? undefined,
    });
  }

  /**
   * 后通道登出
   * - 验证登出令牌签名后批量撤销对应用户的 refresh_token
   */
  async backchannelLogout(logout_token: string): Promise<RevocationResult> {
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
    return new RevocationResult({ ok: true });
  }

  /**
   * 列出可用客户端
   * - 返回 client_id/name/default_redirect_uri/scopes
   */
  async listClients(): Promise<ClientInfo[]> {
    const rows = await OidcClientModel.findAll({
      where: { status: 'active' },
      attributes: ['client_id', 'name', 'allowed_redirect_uris', 'scopes'],
    });
    return rows.map(r => {
      const uris = Array.isArray((r as any).allowed_redirect_uris)
        ? ((r as any).allowed_redirect_uris as any[])
        : [];
      const scopesArr = Array.isArray((r as any).scopes)
        ? ((r as any).scopes as string[])
        : undefined;
      return new ClientInfo({
        client_id: r.client_id as string,
        name: (r as any).name ?? undefined,
        default_redirect_uri:
          typeof uris[0] === 'string' ? (uris[0] as string) : undefined,
        scopes: scopesArr ?? undefined,
      });
    });
  }
}
