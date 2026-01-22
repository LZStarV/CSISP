import { z } from 'zod';

import {
  demoTest,
  AdminDemoTestParams,
  AdminDemoTestResult,
} from './demo.controller';

export const AdminModule = {
  subProject: 'admin',
  handlers: {
    'demo.test': demoTest,
  },
  schemas: {
    'demo.test': {
      summary: 'Admin demo method',
      description: 'Test method for admin subProject',
      params: AdminDemoTestParams,
      result: AdminDemoTestResult,
    },
  },
};
