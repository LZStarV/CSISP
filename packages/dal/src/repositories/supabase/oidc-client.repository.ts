import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import type {
  OidcClientRow,
  OidcClientInsert,
  OidcClientUpdate,
} from '../../types';
import type { IQueryableRepository } from '../base';

import { BaseSupabaseRepository } from './base.supabase.repository';

/**
 * OIDC 客户端 Repository 接口
 */
export interface IOidcClientRepository extends IQueryableRepository<
  OidcClientRow,
  string,
  OidcClientInsert,
  OidcClientUpdate
> {
  findByClientId(clientId: string): Promise<OidcClientRow | null>;
  findActiveClients(): Promise<OidcClientRow[]>;
}

@Injectable()
export class SupabaseOidcClientRepository
  extends BaseSupabaseRepository<
    OidcClientRow,
    string,
    OidcClientInsert,
    OidcClientUpdate
  >
  implements IOidcClientRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'oidc_clients', 'client_id');
  }

  /**
   * 根据客户端 ID 查询
   */
  async findByClientId(clientId: string): Promise<OidcClientRow | null> {
    return this.findOne({ client_id: clientId });
  }

  /**
   * 查找所有活跃的客户端
   */
  async findActiveClients(): Promise<OidcClientRow[]> {
    return this.findMany({ filter: { status: 1 } });
  }
}
