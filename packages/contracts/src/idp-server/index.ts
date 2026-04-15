import { initContract } from '@ts-rest/core';

import { IDP_PATH_PREFIX } from '../constants/path-prefix';

import { idpAuthContract } from './auth.contract';
import { idpOidcContract } from './oidc.contract';

const c = initContract();

export const idpContract = c.router(
  {
    auth: idpAuthContract,
    oidc: idpOidcContract,
  },
  {
    pathPrefix: IDP_PATH_PREFIX,
    strictStatusCodes: true,
  }
);

export * from './auth.contract';
export * from './oidc.contract';
export * from './types';
