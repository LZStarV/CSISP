import {
  PORTAL_PATH_PREFIX,
  type PortalAnnounceAction,
  type GetAnnouncementListParams,
  type GetAnnouncementListResult,
  type CreateAnnouncementParams,
  type CreateAnnouncementResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const announceCall = createDomainCall<PortalAnnounceAction>(
  PORTAL_PATH_PREFIX,
  'announce'
);

export const announceApi = {
  async getAnnouncementList(
    params: GetAnnouncementListParams
  ): Promise<GetAnnouncementListResult> {
    return await announceCall<GetAnnouncementListResult>(
      'getAnnouncementList',
      params
    );
  },

  async createAnnouncement(
    params: CreateAnnouncementParams
  ): Promise<CreateAnnouncementResult> {
    return await announceCall<CreateAnnouncementResult>(
      'createAnnouncement',
      params
    );
  },
};
