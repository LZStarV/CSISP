import { createLogger } from '@csisp/logger';

const baseLogger = createLogger('infra-database');

export function getInfraDbLogger() {
  return baseLogger;
}
