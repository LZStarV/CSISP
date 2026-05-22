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

// OIDC 相关最小类型
export enum OIDCScope {
  Openid = 0,
  Profile = 1,
  Email = 2,
}

export type ClientInfo = {
  client_id: string;
  client_name: string;
  scope: OIDCScope[];
  redirect_uri: string;
  state: string;
};

export type AuthorizationRequestInfo = {
  client_id: string;
  client_name: string;
  scope: OIDCScope[];
  redirect_uri: string;
  state: string;
};
