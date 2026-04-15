import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import { IDP_OIDC_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

const oidcScopeSchema = z.number().int().min(0).max(2);

export const oidcClientInfoSchema = z.object({
  client_id: z.string(),
  name: z.string().nullable().optional(),
  default_redirect_uri: z.string().nullable().optional(),
  scopes: z.array(oidcScopeSchema).nullable().optional(),
});

export const getAuthorizationRequestBodySchema = z.object({
  ticket: z.string().min(1),
});

export const getAuthorizationRequestResultSchema = z.object({
  client_id: z.string(),
  client_name: z.string(),
  scope: z.array(oidcScopeSchema),
  redirect_uri: z.string(),
  state: z.string(),
});

const idpOidcRoutes = {
  clients: {
    method: HTTP_METHOD.POST,
    path: '/clients',
    body: z.object({}).optional(),
    responses: { 200: z.array(oidcClientInfoSchema) },
    summary: '获取客户端列表',
  },
  getAuthorizationRequest: {
    method: HTTP_METHOD.POST,
    path: '/getAuthorizationRequest',
    body: getAuthorizationRequestBodySchema,
    responses: { 200: getAuthorizationRequestResultSchema },
    summary: '获取授权请求',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const idpOidcContract = c.router(idpOidcRoutes, {
  pathPrefix: IDP_OIDC_PATH_PREFIX,
  strictStatusCodes: true,
});

export const IDP_OIDC_ACTION = buildActionMapFromRoutes(idpOidcRoutes);
