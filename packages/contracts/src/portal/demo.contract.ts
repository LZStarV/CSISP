import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import { PORTAL_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

export const getDemoInfoBodySchema = z.object({
  demoId: z.string(),
  withExtra: z.boolean().optional().default(false),
});

export const getDemoInfoResponseSchema = z.object({
  demoInfo: z
    .object({
      demoId: z.string(),
      title: z.string(),
      description: z.string(),
      createTime: z.number(),
    })
    .optional(),
  code: z.number(),
  message: z.string(),
});

const portalDemoRoutes = {
  getDemoInfo: {
    method: HTTP_METHOD.POST,
    path: '/get-demo-info',
    body: getDemoInfoBodySchema,
    responses: { 200: getDemoInfoResponseSchema },
    summary: '获取演示信息',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const portalDemoContract = c.router(portalDemoRoutes, {
  pathPrefix: PORTAL_PATH_PREFIX,
  strictStatusCodes: true,
});

export const PORTAL_DEMO_ACTION = buildActionMapFromRoutes(portalDemoRoutes);
