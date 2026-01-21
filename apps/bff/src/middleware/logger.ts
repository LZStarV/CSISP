import type { Context, Next } from 'koa';
import { getRequestLogger } from '@infra/logger';

// 访问日志中间件
//
// 作用：
// - 记录每个请求的 method/path/status/耗时
// - 可通过 excludePaths 排除不需要记录的路径（如 /health）
// - 可选记录响应体前 N 字符，便于排错
type LoggerOptions = { excludePaths?: string[]; logResponse?: boolean };

export default function logger(options: LoggerOptions = {}) {
  const { excludePaths = ['/health'], logResponse = false } = options;

  return async (ctx: Context, next: Next) => {
    if (excludePaths.some(p => ctx.path.startsWith(p))) return next();
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const log = getRequestLogger(ctx);

    const payload: Record<string, unknown> = {
      context: ctx.path.startsWith('/api/bff') ? 'rpc' : 'http',
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      duration: ms,
      ip: ctx.ip,
    };

    if (logResponse && ctx.body) {
      payload.responsePreview = JSON.stringify(ctx.body).slice(0, 500);
    }

    log.info(payload, 'Request');
  };
}
