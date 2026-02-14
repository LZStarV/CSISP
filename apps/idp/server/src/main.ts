import 'reflect-metadata';
import { requireIntEnv } from '@csisp/utils';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { connect as connectRedis } from './infra/redis';

async function bootstrap() {
  await connectRedis({});
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  await app.listen(requireIntEnv('CSISP_IDP_PORT'));
}

void bootstrap();
