import { IdpAuthModule } from './auth/auth.module';
import { IdpOidcModule } from './oidc/oidc.module';

export { IdpAuthModule } from './auth/auth.module';
export { IdpOidcModule } from './oidc/oidc.module';

export const IdpClientModules = [IdpAuthModule, IdpOidcModule];
