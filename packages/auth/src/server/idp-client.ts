import {
  oidc,
  IAuthorizationRequestArgs,
  IAuthorizationInitResult,
  ITokenRequestArgs,
  ITokenResponse,
  IUserInfo,
  IRevocationResult,
  IAuthorizationRequestInfo,
  AuthorizationRequest,
  OIDCResponseType,
  OIDCPKCEMethod,
  TokenRequest,
  OIDCGrantType,
  OIDCScope,
} from '@csisp/idl/idp';
import { createThriftClient } from '@csisp/rpc/thrift-client';
import { getSafeContext } from '@csisp/rpc/thrift-server';

import { decodeToken } from './jwt';

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
   * 获取授权跳转地址
   */
  async getAuthorizationUrl(
    params: {
      state: string;
      code_challenge: string;
      client_id: string;
      redirect_uri: string;
      scope?: OIDCScope[];
    },
    ctx?: any
  ): Promise<IAuthorizationInitResult> {
    const authReq = new AuthorizationRequest({
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      response_type: OIDCResponseType.Code,
      scope: params.scope || [
        OIDCScope.Openid,
        OIDCScope.Profile,
        OIDCScope.Email,
      ],
      state: params.state,
      code_challenge: params.code_challenge,
      code_challenge_method: OIDCPKCEMethod.S256,
    });

    return this.authorize(authReq, ctx);
  }

  /**
   * 交换令牌
   */
  async token(req: ITokenRequestArgs, ctx?: any): Promise<ITokenResponse> {
    return this.client.token(req, getSafeContext(ctx));
  }

  /**
   * 交换并解码用户信息
   */
  async exchangeAndDecodeUser(
    params: {
      code: string;
      verifier: string;
      client_id: string;
      redirect_uri: string;
    },
    ctx?: any
  ): Promise<{ user: IUserInfo; tokens: ITokenResponse }> {
    const tokenReq = new TokenRequest({
      grant_type: OIDCGrantType.AuthorizationCode,
      code: params.code,
      redirect_uri: params.redirect_uri,
      client_id: params.client_id,
      code_verifier: params.verifier,
    });

    const tokens = await this.token(tokenReq, ctx);
    if (!tokens.id_token) {
      throw new Error('IdP returned no id_token');
    }

    const decoded = decodeToken(tokens.id_token) as any;
    if (!decoded) {
      throw new Error('Invalid ID Token');
    }

    const user: IUserInfo = {
      sub: String(decoded.sub),
      preferred_username: String(decoded.preferred_username || decoded.sub),
      roles: decoded.roles || [],
    };

    return { user, tokens };
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
