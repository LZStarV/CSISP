import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import {
  PORTAL_PATH_PREFIX,
  PORTAL_ANNOUNCE_PATH_PREFIX,
} from '../constants/path-prefix';

const c = initContract();

// 通用响应
const baseResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
});

// Announcement Schema
const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  postType: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// GetAnnouncementList
export const getAnnouncementListBodySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export const getAnnouncementListResponseSchema = baseResponseSchema.extend({
  announcements: z.array(announcementSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

// CreateAnnouncement
export const createAnnouncementBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export const createAnnouncementResponseSchema = baseResponseSchema.extend({
  announcement: announcementSchema.optional(),
});

// Routes
const portalAnnounceRoutes = {
  getAnnouncementList: {
    method: HTTP_METHOD.POST,
    path: PORTAL_ANNOUNCE_PATH_PREFIX + '/getAnnouncementList',
    body: getAnnouncementListBodySchema,
    responses: { 200: getAnnouncementListResponseSchema },
    summary: '获取公告列表',
  },
  createAnnouncement: {
    method: HTTP_METHOD.POST,
    path: PORTAL_ANNOUNCE_PATH_PREFIX + '/createAnnouncement',
    body: createAnnouncementBodySchema,
    responses: { 200: createAnnouncementResponseSchema },
    summary: '创建公告',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const portalAnnounceContract = c.router(portalAnnounceRoutes, {
  pathPrefix: PORTAL_PATH_PREFIX,
  strictStatusCodes: true,
});

export const PORTAL_ANNOUNCE_ACTION =
  buildActionMapFromRoutes(portalAnnounceRoutes);
