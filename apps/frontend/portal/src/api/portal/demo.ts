import { PORTAL_PATH_PREFIX, type PortalDemoAction } from '@csisp/contracts';

import { createDomainCall } from '../caller';

export const portalDemoCall = createDomainCall<PortalDemoAction>(
  PORTAL_PATH_PREFIX,
  'demo'
);
