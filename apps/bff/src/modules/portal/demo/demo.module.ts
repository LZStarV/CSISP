import { z } from 'zod';

import {
  demoTest,
  PortalDemoTestParams,
  PortalDemoTestResult,
} from './demo.controller';

export const PortalModule = {
  subProject: 'portal',
  handlers: {
    'demo.test': demoTest,
  },
  schemas: {
    'demo.test': {
      summary: 'Portal demo method',
      description: 'Test method for portal subProject',
      params: PortalDemoTestParams,
      result: PortalDemoTestResult,
    },
  },
};
