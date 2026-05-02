import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  COMMON_OAUTH2_ACTION,
  COMMON_OAUTH2_PATH_PREFIX,
  COMMON_PATH_PREFIX,
  Oauth2AuthorizeParams,
  Oauth2RevokeParams,
  Oauth2TokenParams,
  oauth2AuthorizeBodySchema,
  oauth2RevokeBodySchema,
  oauth2TokenBodySchema,
} from '@csisp/contracts';
import { Oauth2Service } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const COMMON_OAUTH2_CONTROLLER_PREFIX = `${COMMON_PATH_PREFIX}${COMMON_OAUTH2_PATH_PREFIX}`;

@Controller(COMMON_OAUTH2_CONTROLLER_PREFIX)
export class CommonOauth2Controller {
  private readonly logger = getBffLogger('common-oauth2');

  constructor(private readonly oauth2Service: Oauth2Service) {}

  @Post(COMMON_OAUTH2_ACTION.AUTHORIZE)
  async authorize(
    @Body(new ZodValidationPipe(oauth2AuthorizeBodySchema))
    params: Oauth2AuthorizeParams
  ) {
    this.logger.info(
      { action: COMMON_OAUTH2_ACTION.AUTHORIZE },
      'Common OAuth2 proxy request'
    );
    return firstValueFrom(
      this.oauth2Service
        .oauth2Authorize({
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          response_type: params.responseType,
          scope: params.scope,
          state: params.state,
          nonce: params.nonce,
          code_challenge: params.codeChallenge,
          code_challenge_method: params.codeChallengeMethod,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(COMMON_OAUTH2_ACTION.TOKEN)
  async token(
    @Body(new ZodValidationPipe(oauth2TokenBodySchema))
    params: Oauth2TokenParams
  ) {
    this.logger.info(
      { action: COMMON_OAUTH2_ACTION.TOKEN },
      'Common OAuth2 proxy request'
    );
    return firstValueFrom(
      this.oauth2Service
        .oauth2Token({
          grant_type: params.grantType,
          client_id: params.clientId,
          code: params.code,
          redirect_uri: params.redirectUri,
          client_secret: params.clientSecret,
          code_verifier: params.codeVerifier,
          refresh_token: params.refreshToken,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(COMMON_OAUTH2_ACTION.USERINFO)
  async userinfo() {
    this.logger.info(
      { action: COMMON_OAUTH2_ACTION.USERINFO },
      'Common OAuth2 proxy request'
    );
    return firstValueFrom(
      this.oauth2Service.oauth2Userinfo({}).pipe(map(res => res.data))
    );
  }

  @Post(COMMON_OAUTH2_ACTION.REVOKE)
  async revoke(
    @Body(new ZodValidationPipe(oauth2RevokeBodySchema))
    params: Oauth2RevokeParams
  ) {
    this.logger.info(
      { action: COMMON_OAUTH2_ACTION.REVOKE },
      'Common OAuth2 proxy request'
    );
    return firstValueFrom(
      this.oauth2Service
        .oauth2Revoke({
          token: params.token,
          token_type_hint: params.tokenTypeHint,
        })
        .pipe(map(res => res.data))
    );
  }
}
