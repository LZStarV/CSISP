import { SupabaseDataAccess } from '@csisp/supabase-sdk';

// eslint-disable-next-line no-restricted-imports
import type {
  UserRow,
  UserInsert,
  UserUpdate,
  MfaSettingsRow,
} from '../../types';
import type { IQueryableRepository } from '../base';
import type { UserWithMfa, UserRecoveryInfo } from '../types';

import { BaseSupabaseRepository } from './base.supabase.repository';

/**
 * 用户 Repository 接口 - 仅在需要多个实现时才定义，否则可以直接用类
 */
export interface IUserRepository extends IQueryableRepository<
  UserRow,
  number,
  UserInsert,
  UserUpdate
> {
  findByEmail(email: string): Promise<UserRow | null>;
  findByStudentId(studentId: string): Promise<UserRow | null>;
  findByIds(ids: number[]): Promise<UserRow[]>;
  findWithMfaSettings(id: number): Promise<UserWithMfa | null>;
  findRecoveryInfo(email: string): Promise<UserRecoveryInfo | null>;
  resetPassword(studentId: string, newHash: string): Promise<void>;
}

export class SupabaseUserRepository
  extends BaseSupabaseRepository<UserRow, number, UserInsert, UserUpdate>
  implements IUserRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'user', 'id');
  }

  /**
   * 根据邮箱查询
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    return this.findOne({ email });
  }

  /**
   * 根据学号查询
   */
  async findByStudentId(studentId: string): Promise<UserRow | null> {
    return this.findOne({ student_id: studentId });
  }

  /**
   * 根据 ID 列表查询
   */
  async findByIds(ids: number[]): Promise<UserRow[]> {
    const { data } = await this.sda
      .service()
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    return (data as UserRow[]) || [];
  }

  /**
   * 查找用户及其 MFA 设置 - 使用嵌套查询优化 N+1 问题
   */
  async findWithMfaSettings(id: number): Promise<UserWithMfa | null> {
    const { data } = await this.sda
      .service()
      .from('user')
      .select('*, mfa:mfa_settings(*)')
      .eq('id', id)
      .maybeSingle();

    if (!data) return null;

    const user = data as UserRow & { mfa?: MfaSettingsRow[] };

    return {
      ...user,
      mfaSettings: user.mfa?.[0]
        ? {
            sms_enabled: user.mfa[0].sms_enabled,
            email_enabled: user.mfa[0].email_enabled,
            otp_enabled: user.mfa[0].otp_enabled,
            fido2_enabled: user.mfa[0].fido2_enabled,
          }
        : undefined,
    };
  }

  /**
   * 查找用户找回密码信息
   */
  async findRecoveryInfo(_email: string): Promise<UserRecoveryInfo | null> {
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id, student_id')
      .limit(1)
      .maybeSingle();

    if (!user) return null;

    return {
      id: user.id,
      student_id: user.student_id,
      methods: [],
    };
  }

  /**
   * 重置密码
   */
  async resetPassword(studentId: string, newHash: string): Promise<void> {
    const { error } = await this.sda.service().rpc('auth_reset_password', {
      p_student_id: studentId,
      p_new_hash: newHash,
    });

    if (error) throw error;
  }
}
