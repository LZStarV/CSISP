import { CorsModule } from '@common/cors/cors.module';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { RedisInfraModule } from '@infra/redis.module';
import { SupabaseInfraModule } from '@infra/supabase.module';
import { AdminDemoModule } from '@modules/admin/demo/demo.module';
import { BackofficeDemoModule } from '@modules/backoffice/demo/demo.module';
import { IdpModules } from '@modules/idp';
import { DemoModule as PortalDemoModule } from '@modules/portal/demo/demo.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
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
  ],
})
export class AppModule {}
