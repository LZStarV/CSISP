import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { Oauth2Module } from './oauth2/oauth2.module';
import { OidcModule } from './oidc/oidc.module';

export const DomainModules = [
  AuthModule,
  HealthModule,
  OidcModule,
  Oauth2Module,
];
