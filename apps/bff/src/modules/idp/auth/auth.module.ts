import { buildJsonProxy } from '@common/proxy/http-proxy';
import { config } from '@config';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

@Module({})
export class IdpAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        buildJsonProxy({
          target: `${config.upstream.idpBaseUrl}/api/idp/auth`,
          stripPrefix: 'api/idp/auth',
        })
      )
      .forRoutes({ path: 'idp/auth/*', method: RequestMethod.ALL });
  }
}
