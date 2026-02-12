import 'reflect-metadata';
import { loadRootEnv } from '@csisp/utils';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { connect as connectRedis } from './infra/redis';

async function bootstrap() {
  loadRootEnv();
  if (process.env.REDIS_ENABLED === 'true') {
    await connectRedis({});
  }
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4001);
}

void bootstrap();
