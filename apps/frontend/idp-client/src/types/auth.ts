// 多因子认证方法类型标签
export const MFA_METHOD_LABELS: Record<string, string> = {
  0: '短信验证码',
  1: '邮箱验证码',
  2: 'FIDO2 安全密钥',
  3: '身份验证器应用',
};

// 多因子认证方法类型描述
export const MFA_METHOD_DESCRIPTIONS: Record<string, string> = {
  0: '通过短信接收验证码',
  1: '通过邮箱接收验证码',
  2: '使用安全密钥进行验证',
  3: '使用身份验证器应用生成验证码',
};
