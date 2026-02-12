import type {
  IAuthorizationInitResult,
  IAuthorizationRequestInfo,
  ITokenResponse,
  IJWKSet,
  IUserInfo,
  IRevocationResult,
  IClientInfo,
  IConfiguration,
} from '@csisp/idl/idp';
import {
  AuthorizationRequest,
  TokenRequest,
  OIDCResponseType,
  OIDCPKCEMethod,
  OIDCGrantType,
  OIDCScope,
} from '@csisp/idl/idp';
import { oidc as IdlOIDC } from '@csisp/idl/idp';
import { Post, Body, Param } from '@nestjs/common';

import { ApiIdpController } from '../../common/decorators/controller.decorator';
import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';

import { OidcService } from './oidc.service';

// OIDC 路由参数：action
type OidcActions = (typeof IdlOIDC.methodNames)[number];
// OIDC JSON‑RPC 结果类型
type RpcResult =
  | IAuthorizationInitResult
  | IAuthorizationRequestInfo
  | ITokenResponse
  | IJWKSet
  | IUserInfo
  | IRevocationResult
  | IClientInfo[]
  | IConfiguration;

@ApiIdpController('oidc')
export class OidcController {
  constructor(private readonly svc: OidcService) {}

  /**
   * 处理 OIDC 相关的 JSON‑RPC 请求
   * - 路由格式：POST /api/idp/oidc/:action
   * - 支持 authorize/token/userinfo/jwks/revocation/backchannel/clients/configuration
   * - 将请求体 params 构造成 IDL 请求结构并调用服务层
   */
  @Post(':action')
  async handle(
    @Param('action') action: OidcActions,
    @Body(new RpcRequestPipe())
    body: {
      id: string | number | null;
      params: Record<string, any>;
    }
  ) {
    const id = body.id;
    const params = body.params || {};
    const dispatch: Record<
      OidcActions,
      (p: Record<string, unknown>) => Promise<RpcResult>
    > = {
      authorize: async p => {
        const rawScope = p.scope;
        let scopes: OIDCScope[] = [];

        if (Array.isArray(rawScope)) {
          // 如果已经是数组（可能是枚举值数组或字符串数组）
          scopes = rawScope
            .map(s => {
              if (typeof s === 'number') return s as OIDCScope;
              const str = String(s).toLowerCase();
              if (str === 'openid') return OIDCScope.Openid;
              if (str === 'profile') return OIDCScope.Profile;
              if (str === 'email') return OIDCScope.Email;
              return OIDCScope.Openid;
            })
            .filter((v): v is OIDCScope => v !== undefined);
        } else {
          // 如果是空格分隔的字符串
          scopes = String(rawScope ?? '')
            .split(' ')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => {
              const str = s.toLowerCase();
              if (str === 'openid') return OIDCScope.Openid;
              if (str === 'profile') return OIDCScope.Profile;
              if (str === 'email') return OIDCScope.Email;
              return OIDCScope.Openid;
            });
        }

        const req = new AuthorizationRequest({
          client_id: String(p.client_id ?? ''),
          redirect_uri: String(p.redirect_uri ?? ''),
          response_type: OIDCResponseType.Code,
          scope: scopes,
          state: String(p.state ?? ''),
          code_challenge: String(p.code_challenge ?? ''),
          code_challenge_method: OIDCPKCEMethod.S256,
        });
        return this.svc.startAuthorization(req);
      },
      token: async p => {
        const req = new TokenRequest({
          grant_type:
            String(p.grant_type ?? '') === 'refresh_token'
              ? OIDCGrantType.RefreshToken
              : OIDCGrantType.AuthorizationCode,
          code: String(p.code ?? ''),
          redirect_uri: String(p.redirect_uri ?? ''),
          client_id: String(p.client_id ?? ''),
          code_verifier: String(p.code_verifier ?? ''),
        });
        return this.svc.exchangeToken(req);
      },
      jwks: async _p => this.svc.getJwks(),
      userinfo: async p => this.svc.userinfo(String(p.access_token ?? '')),
      revocation: async p => this.svc.revokeToken(String(p.token ?? '')),
      backchannel_logout: async p =>
        this.svc.backchannelLogout(String(p.logout_token ?? '')),
      clients: async _p => this.svc.listClients(),
      configuration: async _p => this.svc.getConfiguration(),
      getAuthorizationRequest: async p =>
        this.svc.getAuthorizationRequest(String(p.ticket ?? '')),
    };
    const finalHandler = dispatch[action as OidcActions];
    if (!finalHandler) {
      return makeRpcError(id, -32601, 'Method not found');
    }
    const result = await finalHandler(params);
    return makeRpcResponse(id, result);
  }
}
