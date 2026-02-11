import { createLogger } from '@csisp/utils';

export function createIdpLogger(service: string) {
  return createLogger(service);
}

const baseLogger = createLogger('idp-server');

export function getIdpBaseLogger() {
  return baseLogger;
}

export function getIdpLogger(context?: string, traceId?: string) {
  let logger = baseLogger;
  if (context) logger = logger.child({ context });
  if (traceId) logger = logger.child({ traceId });
  return logger;
}
