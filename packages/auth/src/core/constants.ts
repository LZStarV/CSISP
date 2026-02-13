export const AUTH_COOKIE_NAME = 'token';
export const IDP_SESSION_COOKIE_NAME = 'idp_session';
export const OIDC_STATE_COOKIE = 'oidc_state';
export const OIDC_VERIFIER_COOKIE = 'oidc_verifier';

export const DEFAULT_SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

// OIDC 授权范围
export enum OIDCScope {
  Openid = 'openid',
  Profile = 'profile',
  Email = 'email',
}
