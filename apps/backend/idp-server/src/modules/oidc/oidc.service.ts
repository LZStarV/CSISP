import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { SupabaseDataAccess } from '@infra/supabase';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';

import { OIDCScope } from './helpers/oidc.policy';

interface IClientInfo {
  client_id: string;
  name?: string;
  default_redirect_uri?: string;
  scopes?: OIDCScope[];
}
interface IAuthorizationRequestInfo {
  client_id: string;
  client_name: string;
  scope: OIDCScope[];
  redirect_uri: string;
  state: string;
}

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
    ticket: string
  ): Promise<IAuthorizationRequestInfo> {
    const req = await this.ticketIssuer.verify(ticket);
    if (!req) throw new BadRequestException('Invalid ticket');

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
          if (s === 'profile') return OIDCScope.Profile;
          if (s === 'email') return OIDCScope.Email;
          return OIDCScope.Openid;
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

  async listClients(): Promise<IClientInfo[]> {
    type ClientPick = OidcClientPick;
    logger.info('listClients started');
    const { data: rows2 } = await this.sda
      .service()
      .from('oidc_clients')
      .select('client_id,name,allowed_redirect_uris,scopes');
    const list = (rows2 ?? []) as ClientPick[];
    logger.info({ count: list.length }, 'Clients fetched');
    return list.map(r => {
      let scopes: OIDCScope[] = [];
      if (Array.isArray(r.scopes)) {
        scopes = r.scopes as OIDCScope[];
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
