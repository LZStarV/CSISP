import { PortalAnnounceModule } from './announce/announce.module';
import { PortalForumModule } from './forum/forum.module';

export { PortalForumModule } from './forum/forum.module';
export { PortalAnnounceModule } from './announce/announce.module';

export const PortalModules = [PortalForumModule, PortalAnnounceModule];
