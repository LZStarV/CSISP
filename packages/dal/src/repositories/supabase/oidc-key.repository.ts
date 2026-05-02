import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import type { OidcKeyRow, OidcKeyInsert, OidcKeyUpdate } from '../../types';
import type { IQueryableRepository } from '../base';

import { BaseSupabaseRepository } from './base.supabase.repository';

export interface IOidcKeyRepository extends IQueryableRepository<
  OidcKeyRow,
  string,
  OidcKeyInsert,
  OidcKeyUpdate
> {
  findActiveKey(): Promise<OidcKeyRow | null>;
}

@Injectable()
export class SupabaseOidcKeyRepository
  extends BaseSupabaseRepository<
    OidcKeyRow,
    string,
    OidcKeyInsert,
    OidcKeyUpdate
  >
  implements IOidcKeyRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'oidc_keys', 'kid');
  }

  async findActiveKey(): Promise<OidcKeyRow | null> {
    return this.findOne({ status: 'active' });
  }
}
