import { IdpAuthModule } from '@csisp/auth/server';
import { RedisModule } from '@csisp/redis-sdk/nest';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { config } from './config';

@Module({
  imports: [
    IdpAuthModule.register(),
    SupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
    RedisModule.forRoot({
      url: config.redis.upstash.url,
      token: config.redis.upstash.token,
      namespace: config.redis.namespace,
    }),
    MongooseModule.forRoot(config.mongo.uri),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
