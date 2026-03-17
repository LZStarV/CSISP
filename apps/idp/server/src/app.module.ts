import { join } from 'path';

import { RedisModule } from '@csisp/redis-sdk/nest';
import { ThriftRawBodyMiddleware } from '@csisp/rpc/server-nest';
import { SupabaseModule } from '@infra/supabase';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { config } from './config';
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
    SupabaseModule,
    ...DomainModules,
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
export class AppModule implements NestModule {
  /**
   * 配置全局中间件
   */
  configure(consumer: MiddlewareConsumer) {
    // 应用 Thrift 原始主体解析中间件
    // 自动识别 Content-Type，无需硬编码路径
    consumer.apply(ThriftRawBodyMiddleware).forRoutes('*');
  }
}
