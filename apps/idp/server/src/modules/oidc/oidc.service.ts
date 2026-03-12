import crypto from 'crypto';

import { config } from '@config';
import { verifyToken } from '@csisp/auth/server';
import {
  IAuthorizationRequest,
  IAuthorizationInitResult,
  ITokenRequest,
  ITokenResponse,
  IUserInfo,
  IRevocationResult,
  IClientInfo,
  IConfiguration,
  IAuthorizationRequestInfo,
  IJWKSet,
  AuthorizationInitResult,
  AuthorizationRequestInfo,
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
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { OidcClientModel } from '@infra/postgres/models/oidc-client.model';
import { OidcKeyModel } from '@infra/postgres/models/oidc-key.model';
import { RefreshTokenModel } from '@infra/postgres/models/refresh-token.model';
import { UserModel } from '@infra/postgres/models/user.model';
import { del as redisDel } from '@infra/redis';
import { SupabaseDataAccess } from '@infra/supabase';
import { Injectable, BadRequestException } from '@nestjs/common';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';
import { getApiBaseUrl } from '@utils/url';

import { OidcPolicyHelper } from './helpers/oidc.policy';
import { OidcTokenSigner } from './helpers/token.signer';

const logger = getIdpLogger('oidc-service');
const accessTokenExpiresIn = config.auth.accessTokenExpiresIn;
const refreshTokenExpiresIn = config.auth.refreshTokenExpiresIn;

type TokenRefreshRequest = {
  grant_type: OIDCGrantType;
  client_id: string;
  refresh_token: string;
};

interface AuthorizationRequestData {
  client_id: string;
  redirect_uri: string;
  response_type: OIDCResponseType;
  state: string;
  code_challenge: string;
  code_challenge_method: OIDCPKCEMethod;
  scope: string;
  ts: number;
}

@Injectable()
export class OidcService {
  private readonly ticketIssuer = new TicketIssuer<AuthorizationRequestData>({
    prefix: RedisPrefix.OidcTicket,
    ttl: 600,
    idType: TicketIdType.UUID,
  });

  private readonly authReqIssuer = new TicketIssuer<AuthorizationRequestData>({
    prefix: RedisPrefix.OidcAuthReq,
    ttl: 600,
  });

  private readonly codeIssuer = new TicketIssuer<any>({
    prefix: RedisPrefix.OidcCode,
    ttl: 600,
  });

  private readonly tokenSigner = new OidcTokenSigner({
    issuer: getApiBaseUrl(),
    expiresIn: accessTokenExpiresIn,
    refreshExpiresIn: refreshTokenExpiresIn,
    kekSecret: config.auth.oidcKekSecret,
  });

  /**
   * 获取 OIDC 发现配置（Well‑Known）
   * - issuer/authorization_endpoint/token_endpoint/userinfo/jwks_uri 等
   */
  getConfiguration(): IConfiguration {
    const issuer = getApiBaseUrl();
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

  /**
   * 获取用于验证签名的公钥集合（JWKS）
   * - 仅返回状态为 active/retired 的密钥
   */
  async getJwks(): Promise<IJWKSet> {
    type KeyPick = Pick<
      OidcKeys,
      'kid' | 'kty' | 'alg' | 'use' | 'public_pem' | 'status'
    >;
    const { data: rows } = await this.sda
      .service()
      .from('oidc_keys')
      .select('kid,kty,alg,use,public_pem,status');
    const list = (rows ?? []) as KeyPick[];
    const activeStatuses = new Set<string>(['active', 'retired']);
    const keys = list
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
          keyUse: r.use,
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
    params: IAuthorizationRequest
  ): Promise<IAuthorizationInitResult> {
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
    const { data: client } = await this.sda
      .service()
      .from('oidc_clients')
      .select('allowed_redirect_uris,status')
      .eq('client_id', client_id)
      .maybeSingle<ClientPick>();
    if (!client || client.status !== 'active') {
      throw new BadRequestException('Unknown or inactive client');
    }

    if (
      !OidcPolicyHelper.isRedirectUriAllowed(
        redirect_uri,
        client.allowed_redirect_uris as string[] | string | null
      )
    ) {
      throw new BadRequestException('redirect_uri not allowed');
    }

    const scopeStr = OidcPolicyHelper.stringifyScopes(scope);
    const requestData = {
      client_id,
      redirect_uri,
      response_type,
      state,
      code_challenge,
      code_challenge_method,
      scope: scopeStr,
      ts: Date.now(),
    };

    // 使用 TicketIssuer 发放票据
    const ticket = await this.ticketIssuer.issue(requestData);

    // 同时也保留 state 索引，以便兼容老的 enter 逻辑
    await this.authReqIssuer.issue(requestData, state);

    return new AuthorizationInitResult({ ok: true, state, ticket });
  }

  /**
   * 获取授权请求详情 (Ticket 模式)
   */
  async getAuthorizationRequest(
    ticket: string
  ): Promise<IAuthorizationRequestInfo> {
    const req = await this.ticketIssuer.verify(ticket);
    if (!req) throw new BadRequestException('Invalid ticket');

    const { data: client } = await this.sda
      .service()
      .from('oidc_clients')
      .select('name')
      .eq('client_id', req.client_id)
      .maybeSingle<{ name: string | null }>();

    return new AuthorizationRequestInfo({
      client_id: req.client_id,
      client_name: client?.name || 'Unknown Client',
      scope: String(req.scope ?? '')
        .split(' ')
        .filter(Boolean)
        .map(s => {
          if (s === 'profile') return OIDCScope.Profile;
          if (s === 'email') return OIDCScope.Email;
          return OIDCScope.Openid;
        }),
      redirect_uri: req.redirect_uri,
      state: req.state,
    });
  }

  /**
   * 令牌交换与刷新
   * - 授权码模式校验 code_verifier/redirect_uri 等并签发令牌
   * - 刷新模式进行 RT 轮换与防重放
   */
  constructor(private readonly sda: SupabaseDataAccess) {}

  async exchangeToken(
    params: ITokenRequest | TokenRefreshRequest
  ): Promise<ITokenResponse> {
    const client_id = 'client_id' in params ? params.client_id : '';
    const grant_type = 'grant_type' in params ? params.grant_type : undefined;
    logger.info({ client_id, grant_type }, 'exchangeToken started');
    if (!client_id || grant_type === undefined)
      throw new BadRequestException('Invalid token request');
    const isAuthCode = (
      p: ITokenRequest | TokenRefreshRequest
    ): p is ITokenRequest => (p as ITokenRequest).code_verifier !== undefined;
    if (isAuthCode(params)) {
      const { code_verifier, code, redirect_uri } = params;
      if (!code_verifier || !code || !redirect_uri)
        throw new BadRequestException('Invalid token request');

      // 使用 TicketIssuer 消费授权码
      const authObj = await this.codeIssuer.consume(code);
      if (!authObj) throw new BadRequestException('Invalid or expired code');

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
      p: ITokenRequest | TokenRefreshRequest
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
      const { data: cur } = await this.sda
        .service()
        .from('refresh_tokens')
        .select('id,status,sub_hash')
        .eq('rt_hash', rtHash)
        .maybeSingle<RtPick>();
      if (!cur) throw new BadRequestException('Invalid refresh token');
      if (cur.status !== 'active') {
        {
          const { error } = await this.sda
            .service()
            .rpc('auth_revoke_client_rt', {
              p_client_id: client_id,
              p_sub: cur.sub_hash,
            });
          if (error) throw new BadRequestException('Refresh token revoked');
        }
        throw new BadRequestException('Refresh token reused or revoked');
      }
      {
        const { error } = await this.sda.service().rpc('auth_mark_rt_used', {
          p_id: cur.id,
          p_used_at: new Date().toISOString(),
        });
        if (error) throw new BadRequestException('Failed to mark token used');
      }
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
      {
        const { error } = await this.sda
          .service()
          .rpc('auth_issue_refresh_token', {
            p_client_id: client_id,
            p_sub: sub,
            p_rt_hash: newHash,
          });
        if (error) throw new BadRequestException('Failed to rotate token');
      }
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
    logger.info({ client_id, sub, scope }, 'issueTokens started');
    type KeyPick = Pick<
      OidcKeys,
      'kid' | 'public_pem' | 'private_pem_enc' | 'status'
    >;
    const { data: keyRow } = await this.sda
      .service()
      .from('oidc_keys')
      .select('kid,public_pem,private_pem_enc')
      .eq('status', 'active')
      .maybeSingle<Omit<KeyPick, 'status'>>();
    if (!keyRow) {
      logger.error('No active signing key found');
      throw new BadRequestException('No active signing key');
    }
    logger.info({ kid: keyRow.kid }, 'Active key found');
    try {
      const enc = Buffer.isBuffer(keyRow.private_pem_enc)
        ? keyRow.private_pem_enc
        : Buffer.from(String(keyRow.private_pem_enc), 'base64');
      const privatePem = this.tokenSigner.decryptPrivatePem(enc);
      const kid = keyRow.kid;

      // 获取用户信息（角色、用户名等）
      const idNum = Number(sub);
      logger.info({ sub, idNum }, 'Fetching user details for token');
      const user =
        Number.isFinite(idNum) && idNum > 0
          ? ((
              await this.sda
                .service()
                .from('user')
                .select('roles,username,real_name')
                .eq('id', idNum)
                .maybeSingle<{
                  roles: any;
                  username: string | null;
                  real_name: string | null;
                }>()
            ).data ?? null)
          : null;

      logger.info('Signing tokens...');
      const tokens = this.tokenSigner.sign({
        sub,
        clientId: client_id,
        kid,
        privatePem,
        nonce,
        acr,
        amr,
        preferredUsername: user?.username || preferred_username || sub,
        name: user?.real_name || undefined,
        roles: user?.roles || [],
        scope,
      });

      logger.info('Tokens signed successfully');
      // 记录 refresh token
      const rtHash = crypto
        .createHash('sha256')
        .update(tokens.refresh_token)
        .digest('hex');
      {
        const { error } = await this.sda
          .service()
          .rpc('auth_issue_refresh_token', {
            p_client_id: client_id,
            p_sub: sub,
            p_rt_hash: rtHash,
          });
        if (error)
          throw new BadRequestException('Failed to record refresh token');
      }
      logger.info('Refresh token recorded');
      return new TokenResponse({
        ...tokens,
        token_type: 'bearer',
      });
    } catch (err: any) {
      logger.error(err, 'issueTokens error');
      throw err;
    }
  }

  /**
   * 撤销 refresh_token
   * - 根据传入 token 的哈希匹配记录并标记为 revoked
   */
  async revokeToken(token: string): Promise<IRevocationResult> {
    const rtHash = crypto.createHash('sha256').update(token).digest('hex');
    type RtPick = Pick<RefreshTokens, 'id'>;
    const { data: cur } = await this.sda
      .service()
      .from('refresh_tokens')
      .select('id')
      .eq('rt_hash', rtHash)
      .maybeSingle<RtPick>();
    if (!cur) return new RevocationResult({ ok: true });
    {
      const { error } = await this.sda
        .service()
        .rpc('auth_revoke_rt_by_id', { p_id: cur.id as number });
      if (error) throw new BadRequestException('Failed to revoke token');
    }
    return new RevocationResult({ ok: true });
  }

  /**
   * 用户信息查询（验证 RS256 签名）
   * - 验证 access_token 的签名后返回用户声明
   */
  async userinfo(token: string): Promise<IUserInfo> {
    const [h] = token.split('.');
    if (!h) throw new BadRequestException('Invalid token');
    const header = JSON.parse(
      Buffer.from(h.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const kid = header.kid;
    const { data: keyRow } = await this.sda
      .service()
      .from('oidc_keys')
      .select('public_pem')
      .eq('kid', kid)
      .maybeSingle<{ public_pem: string }>();
    if (!keyRow) throw new BadRequestException('Unknown key');
    const pubPem = String(keyRow.public_pem);

    const payload = verifyToken(token, pubPem, { algorithms: ['RS256'] });
    const sub = payload.sub;
    const scope = payload.scope as string | undefined;
    const idNum = Number(sub);
    type UserPick = Pick<
      User,
      'id' | 'username' | 'real_name' | 'email' | 'roles'
    >;
    const user =
      Number.isFinite(idNum) && idNum > 0
        ? ((
            await this.sda
              .service()
              .from('user')
              .select('id,username,real_name,email,roles')
              .eq('id', idNum)
              .maybeSingle<UserPick>()
          ).data ?? null)
        : null;
    const claims: any = { sub };
    if (user) {
      claims.preferred_username = user.username;
      claims.roles = user.roles || [];
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
  async backchannelLogout(logout_token: string): Promise<IRevocationResult> {
    const [h] = logout_token.split('.');
    if (!h) throw new BadRequestException('Invalid token');
    const header = JSON.parse(
      Buffer.from(h.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const kid = header.kid;
    const { data: row2 } = await this.sda
      .service()
      .from('oidc_keys')
      .select('public_pem')
      .eq('kid', kid)
      .maybeSingle<{ public_pem: string }>();
    if (!row2) throw new BadRequestException('Unknown key');
    const pubPem = row2.public_pem as string;

    const payload = verifyToken(logout_token, pubPem, {
      algorithms: ['RS256'],
    });
    const sub = payload.sub;
    {
      const { error } = await this.sda
        .service()
        .rpc('auth_revoke_rt_by_sub', { p_sub: sub as string });
      if (error)
        throw new BadRequestException('Failed to revoke tokens by sub');
    }
    return new RevocationResult({ ok: true });
  }

  async listClients(): Promise<IClientInfo[]> {
    type ClientPick = Pick<
      OidcClients,
      'client_id' | 'name' | 'allowed_redirect_uris' | 'scopes'
    >;
    logger.info('listClients started');
    const { data: rows2 } = await this.sda
      .service()
      .from('oidc_clients')
      .select('client_id,name,allowed_redirect_uris,scopes');
    const list = (rows2 ?? []) as ClientPick[];
    logger.info({ count: list.length }, 'Clients fetched');
    return list.map(r => {
      let scopes: OIDCScope[] = [];
      if (Array.isArray(r.scopes)) {
        scopes = r.scopes as OIDCScope[];
      }
      const uris = Array.isArray(r.allowed_redirect_uris)
        ? r.allowed_redirect_uris
        : [];
      return new ClientInfo({
        client_id: String(r.client_id),
        name: r.name ?? undefined,
        default_redirect_uri: uris[0],
        scopes,
      });
    });
  }
}
