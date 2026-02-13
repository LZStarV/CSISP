/**
 * Redis 键名前缀枚举
 */
export enum RedisPrefix {
  IdpSession = 'idp:sess:',
  IdpOtp = 'idp:otp:',
  IdpReset = 'idp:reset:',
  OidcTicket = 'oidc:ticket:',
  OidcAuthReq = 'oidc:authreq:',
  OidcCode = 'oidc:code:',
}
