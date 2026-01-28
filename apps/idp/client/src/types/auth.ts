export interface MFAMethod {
  _annotations: Record<string, unknown>;
  _fieldAnnotations: Record<string, unknown>;
  type: number; // 0: SMS, 1: email, 2: fido2, 3: otp
  enabled: boolean;
  extra?: string; // Additional info like phone number
}

export interface MFAResponse {
  jsonrpc: string;
  id: string;
  result: {
    _annotations: Record<string, unknown>;
    _fieldAnnotations: Record<string, unknown>;
    next: string[];
    multifactor: MFAMethod[];
  };
}

export const MFA_METHOD_LABELS: Record<number, string> = {
  0: '短信验证码',
  1: '邮箱验证码',
  2: 'FIDO2 安全密钥',
  3: '身份验证器应用',
};

export const MFA_METHOD_DESCRIPTIONS: Record<number, string> = {
  0: '通过短信接收验证码',
  1: '通过邮箱接收验证码',
  2: '使用安全密钥进行验证',
  3: '使用身份验证器应用生成验证码',
};
