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
  OIDCResponseType,
  OIDCGrantType,
  OIDCResponseMode,
  OIDCTokenAuthMethod,
  OIDCPKCEMethod,
  OIDCSigningAlg,
  OIDCScope,
  OIDCClaim,
} from '@csisp/idl/idp';
import type OidcClients from '@csisp/infra-database/public/OidcClients';
import type OidcKeys from '@csisp/infra-database/public/OidcKeys';
import type RefreshTokens from '@csisp/infra-database/public/RefreshTokens';
import type User from '@csisp/infra-database/public/User';
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
  grant_type: OIDCGrantType;
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
      response_types_supported: [OIDCResponseType.Code],
      grant_types_supported: [
        OIDCGrantType.AuthorizationCode,
        OIDCGrantType.RefreshToken,
      ],
      response_modes_supported: [OIDCResponseMode.Query],
      token_endpoint_auth_methods_supported: [OIDCTokenAuthMethod.None],
      code_challenge_methods_supported: [OIDCPKCEMethod.S256],
      id_token_signing_alg_values_supported: [OIDCSigningAlg.Rs256],
      scopes_supported: [OIDCScope.Openid, OIDCScope.Profile, OIDCScope.Email],
      claims_supported: [
        OIDCClaim.Sub,
        OIDCClaim.Name,
        OIDCClaim.PreferredUsername,
        OIDCClaim.Email,
        OIDCClaim.Acr,
        OIDCClaim.Amr,
        OIDCClaim.Nonce,
      ],
    });
  }

  // 解密 OIDC 客户端密钥（AES-GCM 256）
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
    type KeyPick = Pick<
      OidcKeys,
      'kid' | 'kty' | 'alg' | 'use' | 'public_pem' | 'status'
    >;
    const rows = (await OidcKeyModel.findAll({
      attributes: ['kid', 'kty', 'alg', 'use', 'public_pem', 'status'],
      raw: true,
    })) as KeyPick[];
    const activeStatuses = new Set<string>(['active', 'retired']);
    const keys = rows
      .filter(r => activeStatuses.has(r.status))
      .map(r => {
        const pub = crypto.createPublicKey(r.public_pem);
        const jwk = pub.export({ format: 'jwk' }) as {
          n: string;
          e: string;
          kty?: string;
        };
        return new JWK({
          kid: r.kid,
          kty: r.kty,
          alg: r.alg,
          use: r.use,
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
    if (
      !client_id ||
      !redirect_uri ||
      response_type !== OIDCResponseType.Code ||
      !state
    ) {
      throw new BadRequestException('Invalid authorization request');
    }
    if (!code_challenge || code_challenge_method !== OIDCPKCEMethod.S256) {
      throw new BadRequestException('PKCE S256 required');
    }
    type ClientPick = Pick<OidcClients, 'allowed_redirect_uris' | 'status'>;
    const client = (await OidcClientModel.findOne({
      where: { client_id },
      attributes: ['allowed_redirect_uris', 'status'],
      raw: true,
    })) as ClientPick | null;
    if (!client || client.status !== 'active') {
      throw new BadRequestException('Unknown or inactive client');
    }
    let whitelist: string[] = [];
    const ar = client.allowed_redirect_uris as string[] | string | null;
    if (Array.isArray(ar)) {
      whitelist = ar.filter((x: unknown) => typeof x === 'string') as string[];
    } else if (typeof ar === 'string') {
      try {
        const parsed = JSON.parse(ar);
        if (Array.isArray(parsed)) {
          whitelist = parsed.filter(
            (x: unknown) => typeof x === 'string'
          ) as string[];
        }
      } catch {}
    }
    if (!whitelist.includes(redirect_uri)) {
      throw new BadRequestException('redirect_uri not allowed');
    }
    const scopeStr =
      Array.isArray(scope) && scope.length > 0
        ? scope
            .map(s => (OIDCScope as any)[s])
            .filter((x: unknown) => typeof x === 'string')
            .join(' ')
        : 'openid';
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
    const client_id = 'client_id' in params ? params.client_id : '';
    const grant_type = 'grant_type' in params ? params.grant_type : undefined;
    if (!client_id || grant_type === undefined)
      throw new BadRequestException('Invalid token request');
    const isAuthCode = (
      p: TokenRequest | TokenRefreshRequest
    ): p is TokenRequest => (p as TokenRequest).code_verifier !== undefined;
    if (isAuthCode(params)) {
      const { code_verifier, code, redirect_uri } = params;
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
    const isRefresh = (
      p: TokenRequest | TokenRefreshRequest
    ): p is TokenRefreshRequest =>
      (p as TokenRefreshRequest).refresh_token !== undefined;
    if (isRefresh(params)) {
      const { refresh_token } = params;
      if (!refresh_token)
        throw new BadRequestException('Missing refresh_token');
      const rtHash = crypto
        .createHash('sha256')
        .update(refresh_token)
        .digest('hex');
      type RtPick = Pick<RefreshTokens, 'id' | 'status' | 'sub_hash'>;
      const cur = (await RefreshTokenModel.findOne({
        where: { rt_hash: rtHash },
        attributes: ['id', 'status', 'sub_hash'],
        raw: true,
      })) as RtPick | null;
      if (!cur) throw new BadRequestException('Invalid refresh token');
      if (cur.status !== 'active') {
        await RefreshTokenModel.update(
          { status: 'revoked' },
          { where: { client_id, sub_hash: cur.sub_hash } }
        );
        throw new BadRequestException('Refresh token reused or revoked');
      }
      await RefreshTokenModel.update(
        { status: 'rotated', last_used_at: new Date() },
        { where: { id: cur.id } }
      );
      const sub = cur.sub_hash;
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
        .update(String(issued.refresh_token))
        .digest('hex');
      await RefreshTokenModel.create({
        client_id,
        sub_hash: sub,
        rt_hash: newHash,
        status: 'active',
        prev_id: cur.id,
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
    type KeyPick = Pick<
      OidcKeys,
      'kid' | 'public_pem' | 'private_pem_enc' | 'status'
    >;
    const keyRow = (await OidcKeyModel.findOne({
      where: { status: 'active' },
      attributes: ['kid', 'public_pem', 'private_pem_enc'],
      raw: true,
    })) as Omit<KeyPick, 'status'> | null;
    if (!keyRow) throw new BadRequestException('No active signing key');
    const enc = Buffer.isBuffer(keyRow.private_pem_enc)
      ? keyRow.private_pem_enc
      : Buffer.from(String(keyRow.private_pem_enc));
    const privatePem = this.decryptPrivatePem(enc);
    const kid = keyRow.kid;
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
    const pubPem = String(row.public_pem);
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
    type UserPick = Pick<User, 'id' | 'username' | 'real_name' | 'email'>;
    const user =
      Number.isFinite(idNum) && idNum > 0
        ? ((await UserModel.findOne({
            where: { id: idNum },
            attributes: ['id', 'username', 'real_name', 'email'],
            raw: true,
          })) as UserPick | null)
        : null;
    const claims: any = { sub };
    if (user) {
      claims.preferred_username = user.username;
      if (scope && scope.includes('profile')) {
        claims.name = user.real_name;
      }
      if (scope && scope.includes('email')) {
        claims.email = user.email ?? null;
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
    type ClientPick = Pick<
      OidcClients,
      'client_id' | 'name' | 'allowed_redirect_uris' | 'scopes'
    >;
    const rows = (await OidcClientModel.findAll({
      where: { status: 'active' },
      attributes: ['client_id', 'name', 'allowed_redirect_uris', 'scopes'],
      raw: true,
    })) as ClientPick[];
    return rows.map(r => {
      const uris = Array.isArray(r.allowed_redirect_uris)
        ? r.allowed_redirect_uris
        : [];
      const scopesArrStr = Array.isArray(r.scopes)
        ? (r.scopes as string[])
        : undefined;
      const scopesEnums = scopesArrStr
        ? (scopesArrStr
            .map(s => {
              switch (s) {
                case 'openid':
                  return OIDCScope.Openid;
                case 'profile':
                  return OIDCScope.Profile;
                case 'email':
                  return OIDCScope.Email;
                default:
                  return undefined;
              }
            })
            .filter(Boolean) as OIDCScope[])
        : undefined;
      return new ClientInfo({
        client_id: String(r.client_id),
        name: r.name ?? undefined,
        default_redirect_uri:
          typeof uris[0] === 'string' ? (uris[0] as string) : undefined,
        scopes: scopesEnums,
      });
    });
  }
}
