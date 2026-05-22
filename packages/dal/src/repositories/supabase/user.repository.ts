import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import type { UserRow, UserInsert, UserUpdate } from '../../types';
import type { IQueryableRepository } from '../base';
import type { UserRecoveryInfo } from '../types';

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
  findByStudentId(studentId: string): Promise<UserRow | null>;
  findByAuthUserId(authUserId: string): Promise<UserRow | null>;
  findRecoveryInfo(email: string): Promise<UserRecoveryInfo | null>;
  resetPassword(studentId: string, newHash: string): Promise<void>;
}

@Injectable()
export class SupabaseUserRepository
  extends BaseSupabaseRepository<UserRow, number, UserInsert, UserUpdate>
  implements IUserRepository
{
  constructor(sda: SupabaseDataAccess) {
    super(sda, 'user', 'id');
  }

  /**
   * 根据学号查询
   */
  async findByStudentId(studentId: string): Promise<UserRow | null> {
    return this.findOne({ student_id: studentId });
  }

  /**
   * 根据 auth user ID 查询
   */
  async findByAuthUserId(authUserId: string): Promise<UserRow | null> {
    return this.findOne({ auth_user_id: authUserId });
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
