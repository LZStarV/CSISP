import { oidc } from '@csisp/idl/idp';
import {
  IAuthorizationInitResult,
  IAuthorizationRequest,
  ITokenRequest,
  ITokenResponse,
  IJWKSet,
  IUserInfo,
  IRevocationResult,
  IClientInfo,
  IConfiguration,
  IAuthorizationRequestInfo,
} from '@csisp/idl/idp';
import { createThriftMiddleware, runThrift } from '@csisp/rpc/thrift-server';
import { Post, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { ThriftIdpController } from '../../common/decorators/controller.decorator';

import { OidcService } from './oidc.service';

/**
 * IDP OIDC Thrift 控制器
 * - 暴露 /thrift/idp 端点
 * - 实现 Thrift 处理器契约，并转发给 OidcService
 */
@ThriftIdpController('')
export class OidcThriftController implements oidc.IHandler<any> {
  private readonly thriftMiddleware: any;

  constructor(private readonly oidcService: OidcService) {
    // 构造 Thrift 处理器中间件，将自身作为 Handler
    this.thriftMiddleware = createThriftMiddleware(oidc.Processor, this);
  }

  /**
   * 路由入口：匹配根路径及任何子路径
   */
  @Post(['', '*'])
  handle(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    // 使用统一适配器运行中间件，自动处理 URL 补丁
    return runThrift(this.thriftMiddleware, req, res, next);
  }

  async authorize(
    req: IAuthorizationRequest
  ): Promise<IAuthorizationInitResult> {
    return this.oidcService.startAuthorization(req);
  }

  async token(req: ITokenRequest): Promise<ITokenResponse> {
    return this.oidcService.exchangeToken(req);
  }

  async jwks(): Promise<IJWKSet> {
    return this.oidcService.getJwks();
  }

  async userinfo(access_token: string): Promise<IUserInfo> {
    return this.oidcService.userinfo(access_token);
  }

  async revocation(token: string): Promise<IRevocationResult> {
    return this.oidcService.revokeToken(token);
  }

  async backchannel_logout(logout_token: string): Promise<IRevocationResult> {
    return this.oidcService.backchannelLogout(logout_token);
  }

  async clients(): Promise<IClientInfo[]> {
    return this.oidcService.listClients();
  }

  async configuration(): Promise<IConfiguration> {
    return this.oidcService.getConfiguration();
  }

  async getAuthorizationRequest(
    ticket: string
  ): Promise<IAuthorizationRequestInfo> {
    return this.oidcService.getAuthorizationRequest(ticket);
  }
}
