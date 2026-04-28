import {
  COMMON_PATH_PREFIX,
  type CommonAuthAction,
  type SessionParams,
  type SessionResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const authCall = createDomainCall<CommonAuthAction>(COMMON_PATH_PREFIX, 'auth');

export const commonAuthApi = {
  async session(params?: SessionParams): Promise<SessionResult> {
    return await authCall<SessionResult>('session', params || {});
  },

  async logout(): Promise<SessionResult> {
    return await authCall<SessionResult>('logout', {});
  },
};
