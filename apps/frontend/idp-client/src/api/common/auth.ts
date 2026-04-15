import { COMMON_PATH_PREFIX, type CommonAuthAction } from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  CommonAuthAction,
  SessionParams,
  SessionResult,
} from '@csisp/contracts';

export const commonAuthCall = createDomainCall<CommonAuthAction>(
  COMMON_PATH_PREFIX,
  'auth'
);
