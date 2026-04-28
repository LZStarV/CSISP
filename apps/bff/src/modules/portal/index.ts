import { PortalAnnounceModule } from './announce/announce.module';
import { PortalDemoModule } from './demo/demo.module';
import { PortalForumModule } from './forum/forum.module';

export { PortalDemoModule } from './demo/demo.module';
export { PortalForumModule } from './forum/forum.module';
export { PortalAnnounceModule } from './announce/announce.module';

export const PortalModules = [
  PortalDemoModule,
  PortalForumModule,
  PortalAnnounceModule,
];
