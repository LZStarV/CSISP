import { joinUrl, normalizeBaseUrl } from '@csisp/config';
import { call as httpCall } from '@csisp/http/client-fetch';
import { Injectable } from '@nestjs/common';

import { authConfig } from '../config';

import { decodeToken } from './jwt';

type AuthorizationInitResult = { redirectTo?: string; ticket?: string };
type TokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
};
type UserInfo = { sub: string; preferred_username?: string; roles?: string[] };
type RevocationResult = { success: boolean };
type AuthorizationRequestInfo = {
  client_id: string;
  client_name: string;
  scope: string[];
  redirect_uri: string;
  state: string;
};

@Injectable()
export class IdpClient {
  private readonly apiPrefix: string;
  constructor() {
    const serverUrl = authConfig.idp.serverUrl;
    if (!serverUrl) throw new Error('Missing IDP_SERVER_URL for IdpClient');
    this.apiPrefix = joinUrl(normalizeBaseUrl(String(serverUrl)), '/api/idp');
  }

  // 暂未提供 OIDC 授权/令牌 HTTP 端点，以下方法先保留占位
  async authorize(_req: unknown): Promise<AuthorizationInitResult> {
    throw new Error('authorize is not available over HTTP yet');
  }
  async token(_req: unknown): Promise<TokenResponse> {
    throw new Error('token is not available over HTTP yet');
  }
  async exchangeAndDecodeUser(_params: {
    code: string;
    verifier: string;
    client_id: string;
    redirect_uri: string;
  }): Promise<{ user: UserInfo; tokens: TokenResponse }> {
    throw new Error('exchangeAndDecodeUser is not available over HTTP yet');
  }
  async getUserInfo(_accessToken: string): Promise<UserInfo> {
    throw new Error('userinfo is not available over HTTP yet');
  }
  async revokeToken(_token: string): Promise<RevocationResult> {
    throw new Error('revocation is not available over HTTP yet');
  }
  async backchannelLogout(_logoutToken: string): Promise<RevocationResult> {
    throw new Error('backchannel_logout is not available over HTTP yet');
  }

  // 已有 HTTP 端点：getAuthorizationRequest 与 clients
  async getAuthorizationRequest(
    ticket: string
  ): Promise<AuthorizationRequestInfo> {
    const resp = await httpCall<AuthorizationRequestInfo>(
      this.apiPrefix,
      'oidc',
      'getAuthorizationRequest',
      { ticket }
    );
    if (!('error' in resp)) return resp.result;
    throw new Error('getAuthorizationRequest failed');
  }
}
