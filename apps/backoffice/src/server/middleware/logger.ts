import { createLogger } from '@csisp/utils';

const base = createLogger('backoffice');

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
