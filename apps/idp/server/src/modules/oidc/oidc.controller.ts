import type {
  AuthorizationInitResult,
  TokenResponse,
  JWKSet,
  UserInfo,
  RevocationResult,
  ClientInfo,
  Configuration,
} from '@csisp/idl/idp';
import { AuthorizationRequest, TokenRequest } from '@csisp/idl/idp';
import { OIDCService as IdlOIDC } from '@csisp/idl/idp';
import { Controller, Post, Body, Param } from '@nestjs/common';

import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';

import { OidcService } from './oidc.service';
type OidcActions = (typeof IdlOIDC.methodNames)[number];

type RpcResult =
  | AuthorizationInitResult
  | TokenResponse
  | JWKSet
  | UserInfo
  | RevocationResult
  | ClientInfo[]
  | Configuration;

@Controller('oidc')
export class OidcController {
  constructor(private readonly svc: OidcService) {}

  @Post(':action')
  /**
   * 处理 OIDC 相关的 JSON‑RPC 请求
   * - 路由格式：POST /api/idp/oidc/:action
   * - 支持 authorize/token/userinfo/jwks/revocation/backchannel/clients/configuration
   * - 将请求体 params 构造成 IDL 请求结构并调用服务层
   */
  async handle(
    @Param('action') action: string,
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
        const req = new AuthorizationRequest({
          client_id: String(p.client_id ?? ''),
          redirect_uri: String(p.redirect_uri ?? ''),
          response_type: String(p.response_type ?? ''),
          scope: String(p.scope ?? ''),
          state: String(p.state ?? ''),
          code_challenge: String(p.code_challenge ?? ''),
          code_challenge_method: String(p.code_challenge_method ?? ''),
        });
        return this.svc.startAuthorization(req);
      },
      token: async p => {
        const req = new TokenRequest({
          grant_type: String(p.grant_type ?? ''),
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
    };
    const finalHandler = dispatch[action as OidcActions];
    if (!finalHandler) {
      return makeRpcError(id, -32601, 'Method not found');
    }
    const result = await finalHandler(params);
    return makeRpcResponse(id, result);
  }
}
