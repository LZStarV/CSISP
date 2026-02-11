import { createLogger } from '@csisp/utils';

const baseLogger = createLogger('infra-database');

// 导出基础 logger（供当前包内各模块复用）
export function getInfraDbLogger() {
  return baseLogger;
}
