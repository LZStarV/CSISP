import { config } from '@config';
import {
  FORUM_SERVICE_NAME,
  ForumService,
  ANNOUNCE_SERVICE_NAME,
  AnnounceService,
  INTEGRATED_SERVER_PACKAGE_NAME,
} from '@csisp-api/bff-integrated-server';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const INTEGRATED_CLIENT = 'INTEGRATED_CLIENT';

const GrpcPackageDefinition = {
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${FORUM_SERVICE_NAME}`]: ForumService,
  [`${INTEGRATED_SERVER_PACKAGE_NAME}.${ANNOUNCE_SERVICE_NAME}`]:
    AnnounceService,
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
