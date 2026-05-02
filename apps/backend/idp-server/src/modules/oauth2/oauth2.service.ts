import crypto from 'crypto';

import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import { config } from '@config';
import {
  SupabaseOidcClientRepository,
  SupabaseOidcKeyRepository,
  SupabaseRefreshTokenRepository,
  SupabaseUserRepository,
} from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import type { TokenResponse, UserInfoResponse } from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { verifyToken, decodeToken } from '@utils/jwt';
import { OidcPolicyHelper } from '@utils/oidc/oidc.policy';
import { OidcTokenSigner, type SignerOptions } from '@utils/oidc/token.signer';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';

import { Oauth2AuthorizeDto } from './dto/oauth2-authorize.dto';
import { Oauth2RevokeDto } from './dto/oauth2-revoke.dto';
import { Oauth2TokenDto } from './dto/oauth2-token.dto';

const logger = getIdpLogger('oauth2-service');

interface AuthorizationRequestData {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  nonce?: string;
  ts: number;
}

interface AuthorizationCodeData {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  sub: string;
  nonce?: string;
  acr: string;
  amr: string[];
  scope: string;
}

@Injectable()
export class Oauth2Service {
  private readonly ticketIssuer: TicketIssuer<AuthorizationRequestData>;
  private readonly codeIssuer: TicketIssuer<AuthorizationCodeData>;
  private readonly tokenSigner: OidcTokenSigner;

  constructor(
    private readonly oidcClientRepository: SupabaseOidcClientRepository,
    private readonly oidcKeyRepository: SupabaseOidcKeyRepository,
    private readonly refreshTokenRepository: SupabaseRefreshTokenRepository,
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {
    this.ticketIssuer = new TicketIssuer<AuthorizationRequestData>(
      { prefix: RedisPrefix.OidcTicket, ttl: 600, idType: TicketIdType.UUID },
      kv
    );
    this.codeIssuer = new TicketIssuer<AuthorizationCodeData>(
      { prefix: RedisPrefix.OidcCode, ttl: 600 },
      kv
    );

    const signerOpts: SignerOptions = {
      issuer: config.issuer.baseUrl,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      kekSecret: config.auth.oidcKekSecret,
    };
    this.tokenSigner = new OidcTokenSigner(signerOpts);
  }

  async authorize(
    dto: Oauth2AuthorizeDto,
    uidFromSession?: number
  ): Promise<{ ticket: string } | { redirectTo: string }> {
    const client = await this.oidcClientRepository.findByClientId(dto.clientId);
    if (!client || client.status !== 'active') {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Invalid client_id',
        HttpStatus.BAD_REQUEST
      );
    }

    const allowed = OidcPolicyHelper.isRedirectUriAllowed(
      dto.redirectUri,
      client.allowed_redirect_uris as string | string[] | null
    );
    if (!allowed) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'redirect_uri not allowed',
        HttpStatus.BAD_REQUEST
      );
    }

    const ticket = await this.ticketIssuer.issue({
      client_id: dto.clientId,
      redirect_uri: dto.redirectUri,
      response_type: dto.responseType,
      state: dto.state,
      code_challenge: dto.codeChallenge || '',
      code_challenge_method: dto.codeChallengeMethod || '',
      scope: dto.scope,
      nonce: dto.nonce,
      ts: Date.now(),
    });

    if (uidFromSession) {
      const user = await this.userRepository.findById(uidFromSession);
      if (user) {
        const code = await this.codeIssuer.issue({
          client_id: dto.clientId,
          redirect_uri: dto.redirectUri,
          code_challenge: dto.codeChallenge || '',
          sub: String(user.id),
          nonce: dto.nonce,
          acr: 'mfa',
          amr: ['sms'],
          scope: dto.scope || 'openid',
        });

        const redirectTo = `${dto.redirectUri}?code=${code}&state=${encodeURIComponent(dto.state || '')}`;
        return { redirectTo };
      }
    }

    return { ticket };
  }

  async token(dto: Oauth2TokenDto): Promise<TokenResponse> {
    if (dto.grantType === 'authorization_code') {
      return this.handleAuthorizationCodeGrant(dto);
    }
    if (dto.grantType === 'refresh_token') {
      return this.handleRefreshTokenGrant(dto);
    }
    throw new CommonApiException(
      CommonErrorCode.BadRequest,
      'unsupported_grant_type',
      HttpStatus.BAD_REQUEST
    );
  }

  async userinfo(accessToken: string): Promise<UserInfoResponse> {
    const activeKey = await this.oidcKeyRepository.findActiveKey();
    if (!activeKey) {
      throw new CommonApiException(
        CommonErrorCode.InternalError,
        'No active signing key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    let payload: any;
    try {
      payload = verifyToken(accessToken, activeKey.public_pem, {
        algorithms: ['RS256'],
      });
    } catch {
      throw new CommonApiException(
        CommonErrorCode.Unauthorized,
        'Invalid access token',
        HttpStatus.UNAUTHORIZED
      );
    }

    const sub = payload.sub;
    if (!sub) {
      throw new CommonApiException(
        CommonErrorCode.Unauthorized,
        'Invalid token: missing sub',
        HttpStatus.UNAUTHORIZED
      );
    }

    const user = await this.userRepository.findById(Number(sub));
    if (!user) {
      throw new CommonApiException(
        CommonErrorCode.Unauthorized,
        'User not found',
        HttpStatus.UNAUTHORIZED
      );
    }

    return {
      sub: String(user.id),
      preferred_username: user.student_id,
      email_verified: false,
      roles: Array.isArray(user.roles) ? (user.roles as string[]) : undefined,
      student_id: user.student_id,
    };
  }

  async revoke(dto: Oauth2RevokeDto): Promise<void> {
    try {
      const payload = decodeToken(dto.token);
      if (payload?.sub && payload?.aud) {
        const subHash = this.hashSubject(String(payload.sub));
        await this.refreshTokenRepository.revokeByClientIdAndSub(
          String(payload.aud),
          subHash
        );
      }
    } catch {
      logger.warn(
        { tokenTypeHint: dto.tokenTypeHint },
        'Failed to revoke token'
      );
    }
  }

  private async handleAuthorizationCodeGrant(
    dto: Oauth2TokenDto
  ): Promise<TokenResponse> {
    if (!dto.code) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Missing code',
        HttpStatus.BAD_REQUEST
      );
    }

    const codeData = await this.codeIssuer.consume(dto.code);
    if (!codeData) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_grant',
        HttpStatus.BAD_REQUEST
      );
    }

    if (codeData.client_id !== dto.clientId) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_client',
        HttpStatus.BAD_REQUEST
      );
    }

    if (dto.redirectUri && codeData.redirect_uri !== dto.redirectUri) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_grant: redirect_uri mismatch',
        HttpStatus.BAD_REQUEST
      );
    }

    if (codeData.code_challenge && dto.codeVerifier) {
      const expected = crypto
        .createHash('sha256')
        .update(dto.codeVerifier)
        .digest('base64url');
      if (expected !== codeData.code_challenge) {
        throw new CommonApiException(
          CommonErrorCode.BadRequest,
          'invalid_grant: PKCE verification failed',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const activeKey = await this.oidcKeyRepository.findActiveKey();
    if (!activeKey) {
      throw new CommonApiException(
        CommonErrorCode.InternalError,
        'No active signing key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const privatePem = this.tokenSigner.decryptPrivatePem(
      Buffer.from(activeKey.private_pem_enc, 'base64')
    );

    const user = await this.userRepository.findById(Number(codeData.sub));

    const tokens = this.tokenSigner.sign({
      sub: codeData.sub,
      clientId: codeData.client_id,
      kid: activeKey.kid,
      privatePem,
      nonce: codeData.nonce,
      acr: codeData.acr,
      amr: codeData.amr,
      preferredUsername: user?.student_id,
      roles: Array.isArray(user?.roles) ? (user!.roles as string[]) : undefined,
      scope: codeData.scope,
    });

    const rtHash = this.hashToken(tokens.refresh_token);
    const subHash = this.hashSubject(codeData.sub);
    await this.refreshTokenRepository.issueWithRpc(
      codeData.client_id,
      0,
      rtHash,
      subHash
    );

    logger.info(
      { sub: codeData.sub, client_id: codeData.client_id },
      'Token issued via authorization_code grant'
    );

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      token_type: 'Bearer' as const,
      expires_in: tokens.expires_in,
      scope: codeData.scope,
    };
  }

  private async handleRefreshTokenGrant(
    dto: Oauth2TokenDto
  ): Promise<TokenResponse> {
    if (!dto.refreshToken) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Missing refresh_token',
        HttpStatus.BAD_REQUEST
      );
    }

    const activeKey = await this.oidcKeyRepository.findActiveKey();
    if (!activeKey) {
      throw new CommonApiException(
        CommonErrorCode.InternalError,
        'No active signing key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    let payload: any;
    try {
      payload = verifyToken(dto.refreshToken, activeKey.public_pem, {
        algorithms: ['RS256'],
      });
    } catch {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_grant: refresh token invalid',
        HttpStatus.BAD_REQUEST
      );
    }

    if (payload.aud !== dto.clientId) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_client',
        HttpStatus.BAD_REQUEST
      );
    }

    const rtHash = this.hashToken(dto.refreshToken);
    const existingRt = await this.refreshTokenRepository.findByRtHash(rtHash);
    if (!existingRt || existingRt.status !== 'active') {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'invalid_grant: refresh token revoked or not found',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.refreshTokenRepository.revokeById(existingRt.id);

    const privatePem = this.tokenSigner.decryptPrivatePem(
      Buffer.from(activeKey.private_pem_enc, 'base64')
    );

    const user = await this.userRepository.findById(Number(payload.sub));

    const tokens = this.tokenSigner.sign({
      sub: String(payload.sub),
      clientId: dto.clientId,
      kid: activeKey.kid,
      privatePem,
      acr: payload.acr,
      amr: payload.amr,
      preferredUsername: user?.student_id,
      roles: Array.isArray(user?.roles) ? (user!.roles as string[]) : undefined,
      scope: payload.scope,
    });

    const newRtHash = this.hashToken(tokens.refresh_token);
    const subHash = this.hashSubject(String(payload.sub));
    await this.refreshTokenRepository.issueWithRpc(
      dto.clientId,
      existingRt.id,
      newRtHash,
      subHash
    );

    logger.info(
      { sub: payload.sub, client_id: dto.clientId },
      'Token refreshed'
    );

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      token_type: 'Bearer' as const,
      expires_in: tokens.expires_in,
      scope: payload.scope,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private hashSubject(sub: string): string {
    return crypto.createHash('sha256').update(sub).digest('hex');
  }
}
