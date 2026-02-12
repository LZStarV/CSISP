import {
  oidc,
  IAuthorizationRequestArgs,
  IAuthorizationInitResult,
  ITokenRequestArgs,
  ITokenResponse,
  IUserInfo,
  IRevocationResult,
  IAuthorizationRequestInfo,
} from '@csisp/idl/idp';
import { createThriftClient } from '@csisp/rpc/thrift-client';
import { getSafeContext } from '@csisp/rpc/thrift-server';

// IDP Thrift 客户端选项
export interface IdpClientOptions {
  url: string;
  timeout?: number;
}

/**
 * IDP Thrift 客户端 SDK 封装
 * - 内部使用 Thrift RPC 代替 JSON-RPC
 * - 自动处理全链路追踪与强类型契约
 */
export class IdpClient {
  private readonly client: oidc.Client;

  constructor(options: IdpClientOptions) {
    this.client = createThriftClient(oidc.Client, {
      url: options.url,
      timeout: options.timeout,
    });
  }

  /**
   * 初始化 OIDC 授权
   */
  async authorize(
    req: IAuthorizationRequestArgs,
    ctx?: any
  ): Promise<IAuthorizationInitResult> {
    return this.client.authorize(req, getSafeContext(ctx));
  }

  /**
   * 交换或刷新令牌
   */
  async exchangeToken(
    req: ITokenRequestArgs,
    ctx?: any
  ): Promise<ITokenResponse> {
    return this.client.token(req, getSafeContext(ctx));
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string, ctx?: any): Promise<IUserInfo> {
    return this.client.userinfo(accessToken, getSafeContext(ctx));
  }

  /**
   * 撤销令牌
   */
  async revokeToken(token: string, ctx?: any): Promise<IRevocationResult> {
    return this.client.revocation(token, getSafeContext(ctx));
  }

  /**
   * 退出登录
   */
  async backchannelLogout(
    logoutToken: string,
    ctx?: any
  ): Promise<IRevocationResult> {
    return this.client.backchannel_logout(logoutToken, getSafeContext(ctx));
  }

  /**
   * 获取授权请求详情 (Ticket 模式)
   */
  async getAuthorizationRequest(
    ticket: string,
    ctx?: any
  ): Promise<IAuthorizationRequestInfo> {
    return this.client.getAuthorizationRequest(ticket, getSafeContext(ctx));
  }
}
