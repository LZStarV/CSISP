import { CorsModule } from '@common/cors/cors.module';
import { AxiosExceptionFilter } from '@common/filters/axios-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { AppClsModule } from '@infra/cls.module';
import { RedisInfraModule } from '@infra/redis.module';
import { SupabaseInfraModule } from '@infra/supabase.module';
import { UpstreamProxyModule } from '@infra/upstream-proxy.module';
import { CommonModules } from '@modules/common';
import { IdpClientModules } from '@modules/idp-client';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    AppClsModule,
    UpstreamProxyModule,
    SupabaseInfraModule,
    RedisInfraModule,
    CorsModule,

    ...IdpClientModules,
    ...CommonModules,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AxiosExceptionFilter,
    },
  ],
})
export class AppModule {}
