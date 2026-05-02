import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import type {
  RefreshTokenRow,
  RefreshTokenInsert,
  RefreshTokenUpdate,
} from '../../types';
import type { IQueryableRepository } from '../base';

import { BaseSupabaseRepository } from './base.supabase.repository';

export interface IRefreshTokenRepository extends IQueryableRepository<
  RefreshTokenRow,
  number,
  RefreshTokenInsert,
  RefreshTokenUpdate
> {
  findByClientIdAndSub(
    clientId: string,
    subHash: string
  ): Promise<RefreshTokenRow[]>;
  findByRtHash(rtHash: string): Promise<RefreshTokenRow | null>;
  revokeById(id: number): Promise<void>;
  revokeBySub(subHash: string): Promise<number>;
  revokeByClientIdAndSub(clientId: string, subHash: string): Promise<number>;
  markUsed(id: number, usedAt: string): Promise<void>;
  issueWithRpc(
    clientId: string,
    prevId: number,
    rtHash: string,
    sub: string
  ): Promise<number>;
}

@Injectable()
export class SupabaseRefreshTokenRepository
  extends BaseSupabaseRepository<
    RefreshTokenRow,
    number,
    RefreshTokenInsert,
    RefreshTokenUpdate
  >
  implements IRefreshTokenRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'refresh_tokens', 'id');
  }

  async findByClientIdAndSub(
    clientId: string,
    subHash: string
  ): Promise<RefreshTokenRow[]> {
    return this.findMany({
      filter: { client_id: clientId, sub_hash: subHash },
    });
  }

  async findByRtHash(rtHash: string): Promise<RefreshTokenRow | null> {
    return this.findOne({ rt_hash: rtHash });
  }

  async revokeById(id: number): Promise<void> {
    await this.sda.service().rpc('auth_revoke_rt_by_id', { p_id: id });
  }

  async revokeBySub(subHash: string): Promise<number> {
    const { data, error } = await this.sda
      .service()
      .rpc('auth_revoke_rt_by_sub', { p_sub: subHash });
    if (error) throw error;
    return (data as number) ?? 0;
  }

  async revokeByClientIdAndSub(
    clientId: string,
    subHash: string
  ): Promise<number> {
    const { data, error } = await this.sda
      .service()
      .rpc('auth_revoke_client_rt', { p_client_id: clientId, p_sub: subHash });
    if (error) throw error;
    return (data as number) ?? 0;
  }

  async markUsed(id: number, usedAt: string): Promise<void> {
    await this.sda
      .service()
      .rpc('auth_mark_rt_used', { p_id: id, p_used_at: usedAt });
  }

  async issueWithRpc(
    clientId: string,
    prevId: number,
    rtHash: string,
    sub: string
  ): Promise<number> {
    const { data, error } = await this.sda
      .service()
      .rpc('auth_issue_refresh_token', {
        p_client_id: clientId,
        p_prev_id: prevId,
        p_rt_hash: rtHash,
        p_sub: sub,
      });
    if (error) throw error;
    return data as number;
  }
}
