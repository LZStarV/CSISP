import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import {
  PORTAL_PATH_PREFIX,
  PORTAL_FORUM_PATH_PREFIX,
} from '../constants/path-prefix';

const c = initContract();

// 通用响应
const baseResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
});

// Post Schema
const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  postType: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Reply Schema
const replySchema = z.object({
  id: z.string(),
  postId: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  createdAt: z.string(),
});

// CreatePost
export const createPostBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export const createPostResponseSchema = baseResponseSchema.extend({
  post: postSchema.optional(),
});

// GetPostFeed
export const getPostFeedBodySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export const getPostFeedResponseSchema = baseResponseSchema.extend({
  posts: z.array(postSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

// GetPostDetail
export const getPostDetailBodySchema = z.object({
  postId: z.string(),
});

export const getPostDetailResponseSchema = baseResponseSchema.extend({
  post: postSchema.optional(),
  replies: z.array(replySchema).optional(),
});

// CreateReply
export const createReplyBodySchema = z.object({
  postId: z.string(),
  content: z.string().min(1),
});

export const createReplyResponseSchema = baseResponseSchema.extend({
  reply: replySchema.optional(),
});

// Routes
const portalForumRoutes = {
  createPost: {
    method: HTTP_METHOD.POST,
    path: PORTAL_FORUM_PATH_PREFIX + '/createPost',
    body: createPostBodySchema,
    responses: { 200: createPostResponseSchema },
    summary: '创建帖子',
  },
  getPostFeed: {
    method: HTTP_METHOD.POST,
    path: PORTAL_FORUM_PATH_PREFIX + '/getPostFeed',
    body: getPostFeedBodySchema,
    responses: { 200: getPostFeedResponseSchema },
    summary: '获取帖子广场',
  },
  getPostDetail: {
    method: HTTP_METHOD.POST,
    path: PORTAL_FORUM_PATH_PREFIX + '/getPostDetail',
    body: getPostDetailBodySchema,
    responses: { 200: getPostDetailResponseSchema },
    summary: '获取帖子详情',
  },
  createReply: {
    method: HTTP_METHOD.POST,
    path: PORTAL_FORUM_PATH_PREFIX + '/createReply',
    body: createReplyBodySchema,
    responses: { 200: createReplyResponseSchema },
    summary: '创建回复',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const portalForumContract = c.router(portalForumRoutes, {
  pathPrefix: PORTAL_PATH_PREFIX,
  strictStatusCodes: true,
});

export const PORTAL_FORUM_ACTION = buildActionMapFromRoutes(portalForumRoutes);
