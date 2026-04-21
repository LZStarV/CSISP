import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';

export const DomainModules = [AuthModule, OidcModule];
