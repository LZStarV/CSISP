import { SupabaseDataAccess } from '@csisp/supabase-sdk';

// eslint-disable-next-line no-restricted-imports
import type {
  UserRow,
  UserInsert,
  PaginationParams,
  MfaSettingsRow,
} from '../../types';

/** 用户过滤参数 */
export type UserFilterParams = Partial<Pick<UserRow, 'student_id' | 'status'>>;

/** 带 MFA 设置的用户信息 */
export interface UserWithMfa extends UserRow {
  mfaSettings?: Pick<
    MfaSettingsRow,
    'sms_enabled' | 'email_enabled' | 'otp_enabled' | 'fido2_enabled'
  >;
}

/** 用户找回密码信息 */
export interface UserRecoveryInfo extends Pick<UserRow, 'id' | 'student_id'> {
  methods: RecoveryMethod[];
}

/** 找回密码的验证方法 */
export interface RecoveryMethod {
  type: 'sms' | 'email' | 'totp' | 'fido2';
  enabled: boolean;
  extra?: string;
  reason?: string;
}

export class SupabaseUserRepository {
  constructor(private readonly sda: SupabaseDataAccess) {}

  async findById(id: number): Promise<UserRow | null> {
    const { data } = await this.sda
      .service()
      .from('user')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return data;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const { data } = await this.sda
      .service()
      .from('user')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    return data;
  }

  async findByStudentId(studentId: string): Promise<UserRow | null> {
    const { data } = await this.sda
      .service()
      .from('user')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    return data;
  }

  async findByIds(ids: number[]): Promise<UserRow[]> {
    const { data } = await this.sda
      .service()
      .from('user')
      .select('*')
      .in('id', ids);

    return data ?? [];
  }

  async findMany(
    filter: UserFilterParams,
    pagination: PaginationParams
  ): Promise<UserRow[]> {
    let query = this.sda.service().from('user').select('*');

    if (filter.student_id) {
      query = query.eq('student_id', filter.student_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const { data } = await query.range(
      pagination.offset ?? 0,
      (pagination.offset ?? 0) + (pagination.limit ?? 50) - 1
    );

    return data ?? [];
  }

  async create(data: UserInsert): Promise<UserRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('user')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('user')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.sda
      .service()
      .from('user')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  /** 查找用户找回密码信息 */
  async findRecoveryInfo(email: string): Promise<UserRecoveryInfo | null> {
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

  /** 查找用户及其 MFA 设置 */
  async findWithMfaSettings(id: number): Promise<UserWithMfa | null> {
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!user) return null;

    const { data: mfa } = await this.sda
      .service()
      .from('mfa_settings')
      .select('sms_enabled, email_enabled, otp_enabled, fido2_enabled')
      .eq('user_id', id)
      .maybeSingle();

    return {
      ...user,
      mfaSettings: mfa
        ? {
            sms_enabled: mfa.sms_enabled,
            email_enabled: mfa.email_enabled,
            otp_enabled: mfa.otp_enabled,
            fido2_enabled: mfa.fido2_enabled,
          }
        : undefined,
    };
  }

  /** 重置用户密码 */
  async resetPassword(studentId: string, newHash: string): Promise<void> {
    const { error } = await this.sda.service().rpc('auth_reset_password', {
      p_student_id: studentId,
      p_new_hash: newHash,
    });

    if (error) throw error;
  }
}
