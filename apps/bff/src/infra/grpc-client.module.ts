import { config } from '@config';
import {
  DEMO_SERVICE_NAME,
  DemoService,
  INTEGRATED_SERVER_PACKAGE_NAME,
} from '@csisp-api/bff-integrated-server';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const INTEGRATED_CLIENT = 'INTEGRATED_CLIENT';

const GrpcPackageDefinition = {
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${DEMO_SERVICE_NAME}`]: DemoService,
};

@Module({
  imports: [
    ClientsModule.register([
      {
        name: INTEGRATED_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: INTEGRATED_SERVER_PACKAGE_NAME,
          url: config.upstream.integratedServerUrl,
          packageDefinition: GrpcPackageDefinition,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
