import { IdpAuthModule } from '@csisp/auth/server';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { config } from './config';
import { DomainModules } from './modules';

@Module({
  imports: [
    IdpAuthModule.register({
      idp: {
        url: config.auth.idpThriftUrl,
      },
      auth: {
        jwtSecret: config.auth.jwtSecret,
      },
    }),
    SupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
    MongooseModule.forRoot(config.mongo.uri, {
      dbName: config.mongo.dbName,
    }),
    ...DomainModules,
  ],
})
export class AppModule {}
