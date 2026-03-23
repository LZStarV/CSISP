export type UserInfo = {
  sub: string;
  preferred_username?: string;
  roles?: any[];
  email?: string | null;
  name?: string | null;
};

export type AuthorizationInitResult = {
  ok: boolean;
  state: string;
  ticket?: string;
};

export type TokenResponse = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export const OIDC_SERVICE = 'oidc';
