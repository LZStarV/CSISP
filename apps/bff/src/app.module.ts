import { CorsModule } from '@common/cors/cors.module';
import { AxiosExceptionFilter } from '@common/filters/axios-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { AppClsModule } from '@infra/cls.module';
import { IdpSdkModule } from '@infra/idp-sdk.module';
import { RedisInfraModule } from '@infra/redis.module';
import { SupabaseInfraModule } from '@infra/supabase.module';
import { AdminDemoModule } from '@modules/admin/demo/demo.module';
import { BackofficeDemoModule } from '@modules/backoffice/demo/demo.module';
import { IdpModules } from '@modules/idp';
import { DemoModule as PortalDemoModule } from '@modules/portal/demo/demo.module';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    AppClsModule,
    IdpSdkModule,
    SupabaseInfraModule,
    RedisInfraModule,
    CorsModule,
    PortalDemoModule,
    AdminDemoModule,
    BackofficeDemoModule,
    ...IdpModules,
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
