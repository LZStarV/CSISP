import { join } from 'path';

import { RedisModule } from '@csisp/redis-sdk/nest';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { config } from './config';
import { GotrueService } from './infra/supabase/gotrue.service';
import { DomainModules } from './modules';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../client/dist'),
      serveRoot: '/',
    }),
    RedisModule.forRoot({
      url: config.redis.upstash.url,
      token: config.redis.upstash.token,
      namespace: config.redis.namespace,
    }),
    SupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
    ...DomainModules,
  ],
  providers: [
    GotrueService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [GotrueService],
})
export class AppModule {}
