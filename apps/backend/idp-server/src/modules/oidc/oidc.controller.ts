import { ApiIdpController } from '@common/decorators/controller.decorator';
import { JsonRpcInterceptor } from '@common/rpc/json-rpc.interceptor';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import { SupabaseDataAccess } from '@infra/supabase';
import { Body, Post, UseInterceptors, Param, Res } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';

import { OidcService } from './oidc.service';

/**
 * OidcController 重构：采用声明式路由与拦截器模式
 * - 利用 JsonRpcInterceptor 自动包装响应体
 */
@ApiIdpController('oidc')
@UseInterceptors(JsonRpcInterceptor)
export class OidcController {
  constructor(
    private readonly svc: OidcService,
    private readonly sda: SupabaseDataAccess
  ) {}

  @Post('authorize')
  async authorize(@Body(RpcRequestPipe) { params }: any) {
    const rawScope = params.scope;
    let scopes: ('openid' | 'profile' | 'email')[] = [];

    if (Array.isArray(rawScope)) {
      scopes = rawScope.map(s => {
        const str = String(s).toLowerCase();
        if (str === 'openid') return 'openid';
        if (str === 'profile') return 'profile';
        if (str === 'email') return 'email';
        return 'openid';
      }) as ('openid' | 'profile' | 'email')[];
    } else {
      scopes = String(rawScope ?? '')
        .split(' ')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
          const str = s.toLowerCase();
          if (str === 'openid') return 'openid' as const;
          if (str === 'profile') return 'profile' as const;
          if (str === 'email') return 'email' as const;
          return 'openid' as const;
        }) as ('openid' | 'profile' | 'email')[];
    }

    const req = {
      client_id: String(params.client_id ?? ''),
      redirect_uri: String(params.redirect_uri ?? ''),
      response_type: 'code' as const,
      scope: scopes,
      state: String(params.state ?? ''),
      code_challenge: String(params.code_challenge ?? ''),
      code_challenge_method: 'S256' as const,
    };
    return this.svc.startAuthorization(req);
  }

  @Post('token')
  async token(@Body(RpcRequestPipe) { params }: any) {
    const isRefresh = String(params.grant_type ?? '') === 'refresh_token';
    if (isRefresh) {
      const req = {
        grant_type: 'refresh_token' as const,
        client_id: String(params.client_id ?? ''),
        refresh_token: String(params.refresh_token ?? ''),
      };
      return this.svc.exchangeToken(req);
    } else {
      const req = {
        grant_type: 'authorization_code' as const,
        code: String(params.code ?? ''),
        redirect_uri: String(params.redirect_uri ?? ''),
        client_id: String(params.client_id ?? ''),
        code_verifier: String(params.code_verifier ?? ''),
      };
      return this.svc.exchangeToken(req);
    }
  }

  @Post('jwks')
  async jwks() {
    return this.svc.getJwks();
  }

  @Post('userinfo')
  async userinfo(@Body(RpcRequestPipe) { params }: any) {
    return this.svc.userinfo(String(params.access_token ?? ''));
  }

  @Post('revocation')
  async revocation(@Body(RpcRequestPipe) { params }: any) {
    return this.svc.revokeToken(String(params.token ?? ''));
  }

  @Post('backchannel_logout')
  async backchannelLogout(@Body(RpcRequestPipe) { params }: any) {
    return this.svc.backchannelLogout(String(params.logout_token ?? ''));
  }

  @Post('clients')
  async clients() {
    return this.svc.listClients();
  }

  @Post('configuration')
  async configuration() {
    return this.svc.getConfiguration();
  }

  @Post('getAuthorizationRequest')
  async getAuthorizationRequest(@Body(RpcRequestPipe) { params }: any) {
    return this.svc.getAuthorizationRequest(String(params.ticket ?? ''));
  }

  @Post('entrance/:client_id')
  async entrance(@Param('client_id') clientId: string, @Res() res: Response) {
    if (!clientId) throw new BadRequestException('Missing client_id');
    const { data: row } = await this.sda
      .service()
      .from('oidc_clients')
      .select('login_url,allowed_redirect_uris,status')
      .eq('client_id', clientId)
      .maybeSingle<{
        login_url: string | null;
        allowed_redirect_uris: any;
        status: string | null;
      }>();
    if (!row || row.status !== 'active') {
      throw new BadRequestException('Unknown or inactive client');
    }
    const loginUrl = String(row.login_url ?? '');
    const redirects = Array.isArray(row.allowed_redirect_uris)
      ? (row.allowed_redirect_uris as string[])
      : [];
    const ok =
      loginUrl &&
      redirects.length > 0 &&
      redirects.some(u => {
        try {
          return new URL(u).host === new URL(loginUrl).host;
        } catch {
          return false;
        }
      });
    if (!ok) throw new BadRequestException('Entrance not available');
    res.redirect(loginUrl);
  }
}
