import { buildJsonProxy } from '@common/proxy/http-proxy';
import { config } from '@config';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

@Module({})
export class IdpOidcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        buildJsonProxy({
          target: `${config.upstream.idpBaseUrl}/api/idp/oidc`,
          stripPrefix: 'api/idp/oidc',
        })
      )
      .forRoutes({ path: 'idp/oidc/*', method: RequestMethod.ALL });
  }
}
