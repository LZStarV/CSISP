import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import type {
  MfaSettingsRow,
  MfaSettingsInsert,
  MfaSettingsUpdate,
} from '../../types';
import type { IQueryableRepository } from '../base';

import { BaseSupabaseRepository } from './base.supabase.repository';

/**
 * MFA 设置 Repository 接口
 */
export interface IMfaSettingsRepository extends IQueryableRepository<
  MfaSettingsRow,
  number,
  MfaSettingsInsert,
  MfaSettingsUpdate
> {
  findByUserId(userId: number): Promise<MfaSettingsRow | null>;
  upsert(userId: number, data: MfaSettingsInsert): Promise<MfaSettingsRow>;
}

@Injectable()
export class SupabaseMfaSettingsRepository
  extends BaseSupabaseRepository<
    MfaSettingsRow,
    number,
    MfaSettingsInsert,
    MfaSettingsUpdate
  >
  implements IMfaSettingsRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'mfa_settings', 'id');
  }

  /**
   * 根据用户 ID 查询
   */
  async findByUserId(userId: number): Promise<MfaSettingsRow | null> {
    return this.findOne({ user_id: userId });
  }

  /**
   * 插入或更新
   */
  async upsert(
    userId: number,
    data: MfaSettingsInsert
  ): Promise<MfaSettingsRow> {
    const { data: result, error } = await this.sda
      .service()
      .from(this.tableName)
      .upsert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return result as MfaSettingsRow;
  }
}
