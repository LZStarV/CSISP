import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { config } from './config';
import { connect as connectRedis } from './infra/redis';

async function bootstrap() {
  await connectRedis({});
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  await app.listen(config.http.port);
}

void bootstrap();
