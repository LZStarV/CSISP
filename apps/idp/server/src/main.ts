import 'reflect-metadata';
import { loadRootEnv } from '@csisp/utils';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { RpcExceptionFilter } from './common/rpc/rpc-exception.filter';
import { connect as connectRedis } from './infra/redis';

async function bootstrap() {
  loadRootEnv();
  if (process.env.REDIS_ENABLED === 'true') {
    await connectRedis({});
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/idp');
  app.use(cookieParser());
  app.useGlobalInterceptors(
    new RateLimitInterceptor(),
    new LoggingInterceptor()
  );
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4001);
}

void bootstrap();
