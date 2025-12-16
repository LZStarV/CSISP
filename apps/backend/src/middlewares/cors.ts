/**
 * CORS中间件
 * 处理跨域请求
 */

import { Middleware, CorsMiddlewareOptions, Next } from '../types/middleware';
import { AppContext } from '../types/context';

/**
 * CORS中间件
 * 配置跨域资源共享
 */
export const cors = (options: CorsMiddlewareOptions = {}): Middleware => {
  const {
    origin = '*',
    credentials = false,
    allowMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders = [],
    maxAge = 86400, // 24小时
  } = options;

  return async (ctx: AppContext, next: Next) => {
    const requestOrigin = ctx.get('Origin');

    // 处理允许的源
    let allowedOrigin = false;
    if (typeof origin === 'string') {
      allowedOrigin = origin === '*' || origin === requestOrigin;
      if (allowedOrigin) {
        ctx.set('Access-Control-Allow-Origin', origin);
      }
    } else if (Array.isArray(origin)) {
      allowedOrigin = origin.includes(requestOrigin);
      if (allowedOrigin) {
        ctx.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else if (typeof origin === 'function') {
      const customOrigin = origin(ctx);
      ctx.set('Access-Control-Allow-Origin', customOrigin);
      allowedOrigin = true;
    }

    // 设置凭证支持
    if (credentials) {
      ctx.set('Access-Control-Allow-Credentials', 'true');
    }

    // 设置允许的HTTP方法
    if (allowMethods.length > 0) {
      ctx.set('Access-Control-Allow-Methods', (allowMethods as string[]).join(', '));
    }

    // 设置允许的HTTP头
    if (allowHeaders.length > 0) {
      ctx.set('Access-Control-Allow-Headers', (allowHeaders as string[]).join(', '));
    }

    // 设置暴露的HTTP头
    if (exposeHeaders.length > 0) {
      ctx.set('Access-Control-Expose-Headers', (exposeHeaders as string[]).join(', '));
    }

    // 设置预检请求的有效期
    if (maxAge) {
      ctx.set('Access-Control-Max-Age', maxAge.toString());
    }

    // 处理预检请求
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204; // No Content
      return;
    }

    await next();
  };
};

/**
 * 默认CORS配置中间件
 * 适用于大多数场景
 */
export const defaultCors: Middleware = cors({
  origin: (ctx: AppContext): string => {
    const origin = ctx.get('Origin');
    const allowedOrigins = [
      'http://localhost:4000', // BFF 本地默认端口
    ];

    // 开发环境：允许 BFF 与本地无 Origin 的服务间调用
    if (process.env.NODE_ENV === 'development') {
      return origin && allowedOrigins.includes(origin) ? origin : 'http://localhost:4000';
    }

    // 生产环境：仅允许 BFF 域名（通过环境变量或配置）
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'X-Trace-Id',
  ],
  exposeHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
  maxAge: 86400,
});
