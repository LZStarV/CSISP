import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { UseGuards } from '@nestjs/common';
import { Body, Post, Query, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';

import { Oauth2AuthorizeDto } from './dto/oauth2-authorize.dto';
import { Oauth2RevokeDto } from './dto/oauth2-revoke.dto';
import { Oauth2TokenDto } from './dto/oauth2-token.dto';
import { Oauth2Service } from './oauth2.service';

@ApiIdpController('oauth2')
@UseGuards(IdpSessionGuard)
export class Oauth2Controller {
  constructor(private readonly oauth2Service: Oauth2Service) {}

  @Post('authorize')
  async authorize(
    @Body(RequestBodyPipe) dto: Oauth2AuthorizeDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    const uid = (request as any).idpUserId;
    const result = await this.oauth2Service.authorize(dto, uid);

    if ('redirectTo' in result) {
      response.redirect(302, result.redirectTo);
      return;
    }

    return result;
  }

  @Post('token')
  async token(@Body(RequestBodyPipe) dto: Oauth2TokenDto) {
    return this.oauth2Service.token(dto);
  }

  @Post('userinfo')
  async userinfo(@Req() request: ExpressRequest) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        error: 'invalid_token',
        error_description: 'Missing Bearer token',
      };
    }
    const accessToken = authHeader.slice(7);
    return this.oauth2Service.userinfo(accessToken);
  }

  @Post('revoke')
  async revoke(@Body(RequestBodyPipe) dto: Oauth2RevokeDto) {
    await this.oauth2Service.revoke(dto);
    return {};
  }
}
