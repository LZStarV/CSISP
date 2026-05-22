import { initContract } from '@ts-rest/core';

import { buildActionMapFromRoutes } from '../constants/action';
import { COMMON_AUTH_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

const commonAuthRoutes = {};

export const commonAuthContract = c.router(commonAuthRoutes, {
  pathPrefix: COMMON_AUTH_PATH_PREFIX,
  strictStatusCodes: true,
});

export const COMMON_AUTH_ACTION = buildActionMapFromRoutes(commonAuthRoutes);
