import { initContract } from '@ts-rest/core';

import { IDP_CLIENT_PATH_PREFIX } from '../constants/path-prefix';

import { idpClientAuthContract } from './auth.contract';

const c = initContract();

export const idpClientContract = c.router(
  {
    auth: idpClientAuthContract,
  },
  {
    pathPrefix: IDP_CLIENT_PATH_PREFIX,
    strictStatusCodes: true,
  }
);

export * from './auth.contract';
export * from './types';
