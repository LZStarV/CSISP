import 'reflect-metadata';
import { requireIntEnv } from '@csisp/utils';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { RpcExceptionFilter } from './common/rpc/rpc-exception.filter';
import { corsOptions } from './config/cors.config';
import { connect as connectRedis } from './infra/redis';

async function bootstrap() {
  await connectRedis({});

  const app = await NestFactory.create(AppModule);

  app.enableCors(corsOptions);

  app.setGlobalPrefix('');

  // 全局限流、日志与错误处理
  app.useGlobalInterceptors(
    new RateLimitInterceptor(),
    new LoggingInterceptor()
  );
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = requireIntEnv('CSISP_BACKEND_INTEGRATED_PORT');
  await app.listen(port);
}

void bootstrap();
