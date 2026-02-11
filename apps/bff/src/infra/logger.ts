import { createLogger } from '@csisp/utils';
import type { Context } from 'koa';

const baseLogger = createLogger('bff');

export function getBaseLogger() {
  return baseLogger;
}

/**
 * 为请求附加 traceId 子字段（若中间件已设置 ctx.state.traceId）
 */
export function getRequestLogger(ctx: Context) {
  const traceId = (ctx.state as any)?.traceId;
  return traceId ? baseLogger.child({ traceId }) : baseLogger;
}
