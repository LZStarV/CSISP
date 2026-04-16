import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import {
  type ClientInfo,
  type AuthorizationRequestInfo,
} from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { SupabaseDataAccess } from '@infra/supabase';
import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { OIDCScope } from '@utils/oidc/oidc.policy';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';

import { GetAuthorizationRequestDto } from './dto/get-authorization-request.dto';

type OidcClientPick = {
  client_id: string;
  name: string | null;
  allowed_redirect_uris: string[] | string | null;
  scopes: OIDCScope[] | null;
};

const logger = getIdpLogger('oidc-service');

interface AuthorizationRequestData {
  client_id: string;
  redirect_uri: string;
  response_type: number;
  state: string;
  code_challenge: string;
  code_challenge_method: number;
  scope: string;
  ts: number;
}

@Injectable()
export class OidcService {
  private readonly ticketIssuer: TicketIssuer<AuthorizationRequestData>;

  private readonly authReqIssuer: TicketIssuer<AuthorizationRequestData>;

  /**
   * 获取授权请求详情 (Ticket 模式)
   */
  async getAuthorizationRequest(
    dto: GetAuthorizationRequestDto
  ): Promise<AuthorizationRequestInfo> {
    const req = await this.ticketIssuer.verify(dto.ticket);
    if (!req)
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Invalid ticket',
        HttpStatus.BAD_REQUEST
      );

    const { data: client } = await this.sda
      .service()
      .from('oidc_clients')
      .select('name')
      .eq('client_id', req.client_id)
      .maybeSingle<{ name: string | null }>();

    return {
      client_id: req.client_id,
      client_name: client?.name || 'Unknown Client',
      scope: String(req.scope ?? '')
        .split(' ')
        .filter(Boolean)
        .map(s => {
          if (s === 'profile')
            return 'profile' as AuthorizationRequestInfo.ScopeEnum;
          if (s === 'email')
            return 'email' as AuthorizationRequestInfo.ScopeEnum;
          return 'openid' as AuthorizationRequestInfo.ScopeEnum;
        }),
      redirect_uri: req.redirect_uri,
      state: req.state,
    };
  }

  constructor(
    private readonly sda: SupabaseDataAccess,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {
    this.ticketIssuer = new TicketIssuer<AuthorizationRequestData>(
      { prefix: RedisPrefix.OidcTicket, ttl: 600, idType: TicketIdType.UUID },
      kv
    );
    this.authReqIssuer = new TicketIssuer<AuthorizationRequestData>(
      { prefix: RedisPrefix.OidcAuthReq, ttl: 600 },
      kv
    );
  }

  async listClients(): Promise<ClientInfo[]> {
    type ClientPick = OidcClientPick;
    logger.info('listClients started');
    const { data: rows2 } = await this.sda
      .service()
      .from('oidc_clients')
      .select('client_id,name,allowed_redirect_uris,scopes');
    const list = (rows2 ?? []) as ClientPick[];
    logger.info({ count: list.length }, 'Clients fetched');
    return list.map(r => {
      let scopes: ClientInfo.ScopesEnum[] = [];
      if (Array.isArray(r.scopes)) {
        scopes = (r.scopes as OIDCScope[]).map(
          s => s as unknown as ClientInfo.ScopesEnum
        );
      }
      const uris = Array.isArray(r.allowed_redirect_uris)
        ? r.allowed_redirect_uris
        : [];
      return {
        client_id: String(r.client_id),
        name: r.name ?? undefined,
        default_redirect_uri: uris[0],
        scopes,
      };
    });
  }
}
