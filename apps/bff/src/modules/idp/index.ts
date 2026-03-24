import { IdpAuthModule } from './auth/auth.module';
import { IdpHealthModule } from './health/health.module';
import { IdpOidcModule } from './oidc/oidc.module';

export { IdpAuthModule } from './auth/auth.module';
export { IdpOidcModule } from './oidc/oidc.module';
export { IdpHealthModule } from './health/health.module';

export const IdpModules = [IdpAuthModule, IdpOidcModule, IdpHealthModule];
