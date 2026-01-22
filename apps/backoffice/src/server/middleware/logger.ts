import pino from 'pino';

const base = pino();

export function getLogger(child: Record<string, any> = {}) {
  return base.child(child);
}

export function logRpc(ctx: Record<string, any>, meta: Record<string, any>) {
  const logger = getLogger({
    context: 'rpc',
    traceId: ctx.state?.traceId,
    ...meta,
  });
  return logger;
}
