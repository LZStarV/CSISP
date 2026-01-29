import type { IMethod } from '@csisp/idl/idp';
import { MFAType } from '@csisp/idl/idp';

// 多因子认证方法类型
export type MFAMethod = IMethod;

// 多因子认证方法类型标签
export const MFA_METHOD_LABELS: Record<MFAType, string> = {
  [MFAType.Sms]: '短信验证码',
  [MFAType.Email]: '邮箱验证码',
  [MFAType.Fido2]: 'FIDO2 安全密钥',
  [MFAType.Otp]: '身份验证器应用',
};

// 多因子认证方法类型描述
export const MFA_METHOD_DESCRIPTIONS: Record<MFAType, string> = {
  [MFAType.Sms]: '通过短信接收验证码',
  [MFAType.Email]: '通过邮箱接收验证码',
  [MFAType.Fido2]: '使用安全密钥进行验证',
  [MFAType.Otp]: '使用身份验证器应用生成验证码',
};
