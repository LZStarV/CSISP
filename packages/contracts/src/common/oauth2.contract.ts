import type {
  LogoutRequest,
  TokenResponse,
  UserInfoResponse,
} from '@csisp-api/bff-idp-server';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import { COMMON_OAUTH2_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

export const oauth2AuthorizeBodySchema = z.object({
  clientId: z.string().min(1).max(128),
  redirectUri: z.string().min(1).max(1024),
  responseType: z.enum(['code']),
  scope: z.string().min(1).max(256),
  state: z.string().min(1).max(256),
  nonce: z.string().max(256).optional(),
  codeChallenge: z.string().max(128).optional(),
  codeChallengeMethod: z.enum(['S256']).optional(),
});

export const oauth2TokenBodySchema = z.object({
  grantType: z.enum(['authorization_code', 'refresh_token']),
  clientId: z.string().min(1),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
  clientSecret: z.string().optional(),
  codeVerifier: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const oauth2RevokeBodySchema = z.object({
  token: z.string().min(1),
  tokenTypeHint: z.enum(['access_token', 'refresh_token']).optional(),
});

export const oauth2AuthorizeResultSchema = z.object({
  ticket: z.string().optional(),
  redirectTo: z.string().optional(),
});

export const oauth2TokenResultSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.enum(['Bearer']),
  expires_in: z.number(),
  scope: z.string().optional(),
}) satisfies z.ZodType<TokenResponse>;

export const oauth2UserinfoResultSchema = z.object({
  sub: z.string(),
  name: z.string().optional(),
  preferred_username: z.string().optional(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  student_id: z.string().optional(),
}) satisfies z.ZodType<UserInfoResponse>;

const commonOauth2Routes = {
  authorize: {
    method: HTTP_METHOD.POST,
    path: '/authorize',
    body: oauth2AuthorizeBodySchema,
    responses: { 200: oauth2AuthorizeResultSchema },
    summary: 'OIDC 授权端点',
  },
  token: {
    method: HTTP_METHOD.POST,
    path: '/token',
    body: oauth2TokenBodySchema,
    responses: { 200: oauth2TokenResultSchema },
    summary: 'OIDC 令牌端点',
  },
  userinfo: {
    method: HTTP_METHOD.POST,
    path: '/userinfo',
    body: z.object({}).optional(),
    responses: { 200: oauth2UserinfoResultSchema },
    summary: 'OIDC 用户信息端点',
  },
  revoke: {
    method: HTTP_METHOD.POST,
    path: '/revoke',
    body: oauth2RevokeBodySchema,
    responses: { 200: z.object({}) },
    summary: 'Token 撤销端点',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const commonOauth2Contract = c.router(commonOauth2Routes, {
  pathPrefix: COMMON_OAUTH2_PATH_PREFIX,
  strictStatusCodes: true,
});

export const COMMON_OAUTH2_ACTION =
  buildActionMapFromRoutes(commonOauth2Routes);
