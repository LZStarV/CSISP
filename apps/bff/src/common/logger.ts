import { createLogger } from '@csisp/utils';

const baseLogger = createLogger('bff');

export function getLogger(traceId?: string) {
  return traceId ? baseLogger.child({ traceId }) : baseLogger;
}
