import {
  SupabaseOidcClientRepository,
  SupabaseOidcKeyRepository,
  SupabaseRefreshTokenRepository,
  SupabaseUserRepository,
} from '@csisp/dal';
import { Module } from '@nestjs/common';

import { Oauth2Controller } from './oauth2.controller';
import { Oauth2Service } from './oauth2.service';

@Module({
  controllers: [Oauth2Controller],
  providers: [
    Oauth2Service,
    SupabaseOidcClientRepository,
    SupabaseOidcKeyRepository,
    SupabaseRefreshTokenRepository,
    SupabaseUserRepository,
  ],
})
export class Oauth2Module {}
