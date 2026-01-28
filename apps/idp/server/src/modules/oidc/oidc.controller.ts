import crypto from 'crypto';

import { Controller, Get, Query, Post, Body, Headers } from '@nestjs/common';

import { get as redisGet, set as redisSet } from '../../infra/redis';

import { OidcService } from './oidc.service';

@Controller('.well-known')
export class OidcWellKnownController {
  constructor(private readonly svc: OidcService) {}
  @Get('openid-configuration')
  openidConfig() {
    return this.svc.getConfiguration();
  }
}

@Controller('oidc')
export class OidcController {
  constructor(private readonly svc: OidcService) {}

  @Get('authorize')
  async authorize(
    @Query()
    q: {
      response_type?: string;
      client_id?: string;
      redirect_uri?: string;
      scope?: string;
      state?: string;
      code_challenge?: string;
      code_challenge_method?: string;
      nonce?: string;
    }
  ) {
    return this.svc.startAuthorization(q as Record<string, string>);
  }

  @Post('token')
  async token(
    @Body()
    body: {
      grant_type?: string;
      client_id?: string;
      code_verifier?: string;
      code?: string;
      redirect_uri?: string;
      refresh_token?: string;
    }
  ) {
    return this.svc.exchangeToken(body as Record<string, string>);
  }

  @Get('jwks.json')
  jwks() {
    return this.svc.getJwks();
  }

  @Post('revocation')
  async revocation(
    @Body()
    body: {
      token: string;
    }
  ) {
    return this.svc.revokeToken(body.token);
  }

  @Get('userinfo')
  async userinfo(@Headers('authorization') auth?: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      return { error: 'invalid_token' };
    }
    const token = auth.slice('Bearer '.length);
    return this.svc.userinfo(token);
  }
  @Post('backchannel_logout')
  async backchannelLogout(
    @Body()
    body: {
      logout_token: string;
    }
  ) {
    return this.svc.backchannelLogout(body.logout_token);
  }
  @Post('dev/issue_code')
  async devIssueCode(
    @Body()
    body: {
      state: string;
      sub: string;
    }
  ) {
    const auth = await redisGet(`oidc:authreq:${body.state}`);
    if (!auth) return { ok: false };
    const obj = JSON.parse(auth);
    const code = crypto.randomUUID().replace(/-/g, '');
    await redisSet(
      `oidc:code:${code}`,
      JSON.stringify({
        client_id: obj.client_id,
        redirect_uri: obj.redirect_uri,
        code_challenge: obj.code_challenge,
        sub: body.sub,
        nonce: obj.nonce,
      }),
      600
    );
    return { ok: true, code };
  }
}
