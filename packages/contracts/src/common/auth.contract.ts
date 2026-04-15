import type { AuthSessionRequest } from '@csisp-api/bff-idp-server';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import { COMMON_AUTH_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

export const sessionBodySchema = z.object({
  logout: z.boolean().optional(),
}) satisfies z.ZodType<AuthSessionRequest>;

export const sessionResponseSchema = z.object({
  logged: z.boolean(),
  name: z.string().optional(),
  student_id: z.string().optional(),
});

const commonAuthRoutes = {
  session: {
    method: HTTP_METHOD.POST,
    path: '/session',
    body: sessionBodySchema,
    responses: { 200: sessionResponseSchema },
    summary: '检查会话',
  },
  logout: {
    method: HTTP_METHOD.POST,
    path: '/logout',
    body: z.object({}).optional(),
    responses: { 200: sessionResponseSchema },
    summary: '注销会话',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const commonAuthContract = c.router(commonAuthRoutes, {
  pathPrefix: COMMON_AUTH_PATH_PREFIX,
  strictStatusCodes: true,
});

export const COMMON_AUTH_ACTION = buildActionMapFromRoutes(commonAuthRoutes);
