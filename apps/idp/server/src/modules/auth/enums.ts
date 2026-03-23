export enum AuthNextStep {
  Multifactor = 0,
  ResetPassword = 1,
  Enter = 2,
  Finish = 3,
}

export enum MFAType {
  Sms = 0,
  Email = 1,
  Fido2 = 2,
  Otp = 3,
}

export enum ResetReason {
  ForgetPassword = 0,
  WeakPassword = 1,
}

export enum RecoveryUnavailableReason {
  NotBoundPhone = 0,
  NotBoundEmail = 1,
  MethodDisabled = 2,
  NotImplemented = 3,
  PolicyDenied = 4,
}

export type IMethod = {
  type: MFAType;
  enabled: boolean;
  extra?: string;
};

export type RSATokenResult = {
  publicKey: string;
  token?: string;
};

export type LoginResult = {
  nextSteps: AuthNextStep[];
  multifactor?: IMethod[];
  reset_password?: { forget_password?: boolean; weak_password?: boolean };
};

export type RecoveryMethod = {
  type: MFAType;
  enabled: boolean;
  extra?: string;
  reason?: RecoveryUnavailableReason;
};

export type RecoveryInitResult = {
  student_id: string;
  name?: string;
  methods: RecoveryMethod[];
};

export type VerifyResult = {
  ok: boolean;
  reset_token?: string;
};

export type SessionResult = {
  logged: boolean;
  name?: string;
  student_id?: string;
};

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
