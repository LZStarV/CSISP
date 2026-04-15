import type { CommonAuthAction } from '@csisp/contracts';
import * as contracts from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  CommonAuthAction,
  SessionParams,
  SessionResult,
} from '@csisp/contracts';

export const commonAuthCall = createDomainCall<CommonAuthAction>(
  contracts.COMMON_PATH_PREFIX,
  'auth'
);
