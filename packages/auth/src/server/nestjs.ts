import {
  Module,
  DynamicModule,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
  Global,
  Inject,
  Provider,
} from '@nestjs/common';

import { verifyAuth, AuthGuardOptions } from './guard';
import { IdpClient, IdpClientOptions, IDP_CLIENT_OPTIONS } from './idp-client';

export const IDP_AUTH_GUARD_OPTIONS = 'IDP_AUTH_GUARD_OPTIONS';

/**
 * 认证守卫 (NestJS 适配)
 * - 从请求头提取 JWT 令牌
 * - 调用 verifyAuth 进行校验
 * - 将用户信息挂载到 request.user
 */
@Injectable()
export class IdpAuthGuard implements CanActivate {
  constructor(
    @Inject(IDP_AUTH_GUARD_OPTIONS) private readonly options: AuthGuardOptions
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const user = await verifyAuth(token, this.options);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 将用户信息注入请求对象，供 @CurrentUser 装饰器使用
    request.user = user;
    return true;
  }
}

/**
 * 当前用户装饰器
 * - 从请求对象中提取 user 字段
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

/**
 * IDP 认证模块
 * - 全局模块，提供 IdpClient 和 IdpAuthGuard
 */
@Global()
@Module({})
export class IdpAuthModule {
  static register(options: {
    idp: IdpClientOptions;
    auth: AuthGuardOptions;
  }): DynamicModule {
    const idpClientOptionsProvider: Provider = {
      provide: IDP_CLIENT_OPTIONS,
      useValue: options.idp,
    };

    const authOptionsProvider: Provider = {
      provide: IDP_AUTH_GUARD_OPTIONS,
      useValue: options.auth,
    };

    return {
      module: IdpAuthModule,
      providers: [
        idpClientOptionsProvider,
        authOptionsProvider,
        IdpClient,
        IdpAuthGuard,
      ],
      exports: [IdpClient, IdpAuthGuard, IDP_AUTH_GUARD_OPTIONS],
    };
  }
}
