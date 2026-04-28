import {
  PORTAL_PATH_PREFIX,
  type PortalForumAction,
  type CreatePostParams,
  type CreatePostResult,
  type GetPostFeedParams,
  type GetPostFeedResult,
  type GetPostDetailParams,
  type GetPostDetailResult,
  type CreateReplyParams,
  type CreateReplyResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const forumCall = createDomainCall<PortalForumAction>(
  PORTAL_PATH_PREFIX,
  'forum'
);

export const forumApi = {
  async createPost(params: CreatePostParams): Promise<CreatePostResult> {
    return await forumCall<CreatePostResult>('createPost', params);
  },

  async getPostFeed(params: GetPostFeedParams): Promise<GetPostFeedResult> {
    return await forumCall<GetPostFeedResult>('getPostFeed', params);
  },

  async getPostDetail(
    params: GetPostDetailParams
  ): Promise<GetPostDetailResult> {
    return await forumCall<GetPostDetailResult>('getPostDetail', params);
  },

  async createReply(params: CreateReplyParams): Promise<CreateReplyResult> {
    return await forumCall<CreateReplyResult>('createReply', params);
  },
};
