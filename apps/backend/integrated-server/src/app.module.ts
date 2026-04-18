import { DtoValidationInterceptor } from '@common/http/dto-validation.interceptor';
import { config } from '@config';
import { RedisModule } from '@csisp/redis-sdk/nest';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { DomainModules } from '@modules/index';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
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
    ...DomainModules,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DtoValidationInterceptor,
    },
  ],
})
export class AppModule {}
