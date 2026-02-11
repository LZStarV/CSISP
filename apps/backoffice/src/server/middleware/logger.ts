import pino from 'pino';

// Backoffice 服务端日志：不使用通用工具库以避免 Next.js 15 环境下的 worker 冲突
const base = pino({
  level: process.env.LOG_LEVEL || 'info',
}).child({ service: 'backoffice', env: process.env.NODE_ENV });

export function getLogger(child: Record<string, any> = {}) {
  return base.child(child);
}

export function logRpc(ctx: Record<string, any>, meta: Record<string, any>) {
  const logger = getLogger({
    context: 'rpc',
    traceId: ctx.state?.traceId,
    userId: ctx.state?.user?.id,
    roles: ctx.state?.user?.roles,
    ...meta,
  });
  return logger;
}
