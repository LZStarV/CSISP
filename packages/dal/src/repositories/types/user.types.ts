// eslint-disable-next-line no-restricted-imports
import type { UserRow, MfaSettingsRow } from '../../types';

/**
 * 带 MFA 设置的用户信息
 */
export interface UserWithMfa extends UserRow {
  mfaSettings?: Pick<
    MfaSettingsRow,
    'sms_enabled' | 'email_enabled' | 'otp_enabled' | 'fido2_enabled'
  >;
}

/**
 * 用户找回密码信息
 */
export interface UserRecoveryInfo extends Pick<UserRow, 'id' | 'student_id'> {
  methods: RecoveryMethod[];
}

/**
 * 找回密码的验证方法
 */
export interface RecoveryMethod {
  type: 'sms' | 'email' | 'totp' | 'fido2';
  enabled: boolean;
  extra?: string;
  reason?: string;
}
