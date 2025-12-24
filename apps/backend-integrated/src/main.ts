import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { corsOptions } from './config/cors.config';
import { connect as connectRedis } from '@infra/redis';

// 优先根目录 .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.resolve(rootDir, '.env'), override: false });
dotenv.config({ path: path.resolve(rootDir, 'apps/backend-integrated/.env'), override: false });

async function bootstrap() {
  if (process.env.REDIS_ENABLED === 'true') {
    await connectRedis({});
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors(corsOptions);

  // 设置全局 API 前缀
  // TODO: 考虑是否需要根据环境变量配置前缀
  app.setGlobalPrefix('api');

  // 全局限流、日志与错误处理
  app.useGlobalInterceptors(new RateLimitInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.BACKEND_INTEGRATED_PORT ?? 3100);
  await app.listen(port);
}

void bootstrap();
