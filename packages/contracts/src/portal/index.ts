import { initContract } from '@ts-rest/core';

import { PORTAL_PATH_PREFIX } from '../constants/path-prefix';

import { portalAnnounceContract } from './announce.contract';
import { portalDemoContract } from './demo.contract';
import { portalForumContract } from './forum.contract';

const c = initContract();

export const portalContract = c.router(
  {
    demo: portalDemoContract,
    forum: portalForumContract,
    announce: portalAnnounceContract,
  },
  {
    pathPrefix: PORTAL_PATH_PREFIX,
    strictStatusCodes: true,
  }
);

export * from './demo.contract';
export * from './forum.contract';
export * from './announce.contract';
export * from './types';
