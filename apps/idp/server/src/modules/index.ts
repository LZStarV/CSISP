import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OidcModule } from './oidc/oidc.module';

export const DomainModules = [AuthModule, HealthModule, OidcModule];
