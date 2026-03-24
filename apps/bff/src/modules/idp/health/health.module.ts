import { buildJsonProxy } from '@common/proxy/http-proxy';
import { config } from '@config';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

@Module({})
export class IdpHealthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        buildJsonProxy({
          target: `${config.upstream.idpBaseUrl}/api/idp/health`,
          stripPrefix: 'api/idp/health',
        })
      )
      .forRoutes({ path: 'idp/health/*', method: RequestMethod.ALL });
  }
}
