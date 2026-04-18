import 'reflect-metadata';
import { INTEGRATED_SERVER_PACKAGE_NAME } from '@csisp-api/integrated-server';
import { GrpcPackageDefinition } from '@modules/index';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: INTEGRATED_SERVER_PACKAGE_NAME,
      url: '0.0.0.0:50051',
      packageDefinition: GrpcPackageDefinition,
    },
  });

  await app.listen();
}

void bootstrap();
