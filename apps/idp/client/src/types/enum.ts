// 前端本地契约类型（最小集合），用于替代对 @csisp/idl 的直接依赖
export enum MFAType {
  Sms = 0,
  Email = 1,
  Fido2 = 2,
  Otp = 3,
}

export type IMethod = {
  type: MFAType;
  enabled: boolean;
  extra?: string | null;
};

export enum AuthNextStep {
  Multifactor = 0,
  ResetPassword = 1,
  Enter = 2,
  Finish = 3,
}

export type Next = {
  nextSteps: AuthNextStep[];
  sms?: {
    code: string;
    success: boolean;
    message?: string;
    request_id?: string;
    access_denied_detail?: string;
  };
  redirectTo?: string;
};

export type SessionResult = {
  logged: boolean;
  name?: string;
  student_id?: string;
};

export enum RecoveryUnavailableReason {
  NotBoundPhone = 0,
  NotBoundEmail = 1,
  MethodDisabled = 2,
  NotImplemented = 3,
  PolicyDenied = 4,
}

export type RecoveryMethod = {
  type: MFAType;
  enabled: boolean;
  extra?: string | null;
  reason?: RecoveryUnavailableReason | null;
};

export type RecoveryInitResult = {
  student_id: string;
  name?: string | null;
  methods: RecoveryMethod[];
};

export type VerifyResult = {
  ok: boolean;
  reset_token?: string;
};

// OIDC 相关最小类型
export enum OIDCScope {
  Openid = 0,
  Profile = 1,
  Email = 2,
}

export type ClientInfo = {
  client_id: string;
  name?: string | null;
  default_redirect_uri?: string | null;
  scopes?: OIDCScope[] | null;
};

export type AuthorizationRequestInfo = {
  client_id: string;
  client_name: string;
  scope: OIDCScope[];
  redirect_uri: string;
  state: string;
};

export type MfaMethodsResult = {
  multifactor: IMethod[];
};
