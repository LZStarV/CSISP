import { DtoValidationInterceptor } from '@common/http/dto-validation.interceptor';
import { config } from '@config';
import { MongoDalModule } from '@csisp/dal';
import { RedisModule } from '@csisp/redis-sdk/nest';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { DomainModules } from '@modules/index';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
    TypegooseModule.forRoot(config.mongo.uri),
    MongoDalModule,
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
