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
   * 提取安全的 RPC 上下文，防止上下文污染
   * - 仅透传链路追踪相关的 Header
   * - 严禁透传 url 等可能导致 Thrift 客户端重写请求路径的属性
   */
  private getSafeContext(ctx?: any) {
    const safeCtx: any = { headers: {} };
    if (ctx?.headers) {
      // 仅透传 trace 相关 header
      const traceId =
        ctx.headers.get?.('x-trace-id') || ctx.headers['x-trace-id'];
      if (traceId) {
        safeCtx.headers['x-trace-id'] = traceId;
      }
    }
    return safeCtx;
  }

  /**
   * 初始化 OIDC 授权
   */
  async authorize(
    req: IAuthorizationRequestArgs,
    ctx?: any
  ): Promise<IAuthorizationInitResult> {
    return this.client.authorize(req, this.getSafeContext(ctx));
  }

  /**
   * 交换或刷新令牌
   */
  async exchangeToken(
    req: ITokenRequestArgs,
    ctx?: any
  ): Promise<ITokenResponse> {
    return this.client.token(req, this.getSafeContext(ctx));
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string, ctx?: any): Promise<IUserInfo> {
    return this.client.userinfo(accessToken, this.getSafeContext(ctx));
  }

  /**
   * 撤销令牌
   */
  async revokeToken(token: string, ctx?: any): Promise<IRevocationResult> {
    return this.client.revocation(token, this.getSafeContext(ctx));
  }

  /**
   * 获取授权请求详情 (Ticket 模式)
   */
  async getAuthorizationRequest(
    ticket: string,
    ctx?: any
  ): Promise<IAuthorizationRequestInfo> {
    return this.client.getAuthorizationRequest(
      ticket,
      this.getSafeContext(ctx)
    );
  }
}
