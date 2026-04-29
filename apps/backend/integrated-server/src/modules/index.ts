import {
  ForumService,
  AnnounceService,
  INTEGRATED_SERVER_PACKAGE_NAME,
  FORUM_SERVICE_NAME,
  ANNOUNCE_SERVICE_NAME,
} from '@csisp-api/integrated-server';

import { AnnounceModule } from './announce/announce.module';
import { ForumModule } from './forum/forum.module';

export const DomainModules = [ForumModule, AnnounceModule];

export const GrpcPackageDefinition = {
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${FORUM_SERVICE_NAME}`]: ForumService,
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${ANNOUNCE_SERVICE_NAME}`]:
    AnnounceService,
};
