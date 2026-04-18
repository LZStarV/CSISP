import { PORTAL_PATH_PREFIX, type PortalDemoAction } from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  GetDemoInfoParams,
  GetDemoInfoResult,
  PortalDemoAction,
} from '@csisp/contracts';

export const portalDemoCall = createDomainCall<PortalDemoAction>(
  PORTAL_PATH_PREFIX,
  'demo'
);
