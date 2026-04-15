import 'reflect-metadata';
import { TrustedOriginsService } from '@common/cors/trusted-origins.service';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const trusted = app.get(TrustedOriginsService, { strict: false } as any);
  app.enableCors({
    origin: async (origin, callback) => {
      try {
        const allowed = await trusted.isAllowed(origin);
        callback(null, allowed);
      } catch {
        callback(null, false);
      }
    },
    credentials: true,
  });

  await app.listen(4000);
}

void bootstrap();
