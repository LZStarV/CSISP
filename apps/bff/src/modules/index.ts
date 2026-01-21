import { AdminModules } from './admin';
import { PortalModules } from './portal';

export const DomainModules = [...AdminModules, ...PortalModules];
