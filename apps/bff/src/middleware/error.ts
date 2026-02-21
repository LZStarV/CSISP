import { getRequestLogger } from '@infra/logger';
import type { Context, Next } from 'koa';

import { config } from '../config';

// 全局错误处理中间件
//
// 作用：
// - 捕获下游中间件与路由中的异常
// - 将错误统一包装为 { code, message, stack? } 的 JSON 响应
// - 在开发环境（NODE_ENV=development）可选附带 stack 便于调试
// - 可配置是否输出错误日志到日志系统
type ErrorOptions = { showDetailsInDev?: boolean; logErrors?: boolean };

export default function error(options: ErrorOptions = {}) {
  const { showDetailsInDev = true, logErrors = true } = options;

  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (e: any) {
      const err = e as Error & { status?: number };
      if (logErrors) {
        const log = getRequestLogger(ctx);
        log.error(
          {
            context: 'error',
            err,
            method: ctx.method,
            path: ctx.path,
            status: ctx.status,
          },
          'Unhandled error in BFF'
        );
      }
      ctx.status =
        err.status || (ctx.status && ctx.status >= 400 ? ctx.status : 500);
      const body: Record<string, unknown> = {
        code: ctx.status,
        message: err.message || 'Internal Error',
      };
      if (showDetailsInDev && config.runtime.isDev) {
        body.stack = err.stack;
      }
      ctx.body = body;
    }
  };
}
