import { initContract } from '@ts-rest/core';

import { PORTAL_PATH_PREFIX } from '../constants/path-prefix';

import { portalDemoContract } from './demo.contract';

const c = initContract();

export const portalContract = c.router(
  {
    demo: portalDemoContract,
  },
  {
    pathPrefix: PORTAL_PATH_PREFIX,
    strictStatusCodes: true,
  }
);

export * from './demo.contract';
export * from './types';
