import {
  DemoService,
  INTEGRATED_SERVER_PACKAGE_NAME,
  DEMO_SERVICE_NAME,
} from '@csisp-api/integrated-server';

import { DemoModule } from './demo/demo.module';

export const DomainModules = [DemoModule];

export const GrpcPackageDefinition = {
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${DEMO_SERVICE_NAME}`]: DemoService,
};
