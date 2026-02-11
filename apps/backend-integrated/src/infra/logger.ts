import { createLogger } from '@csisp/utils';

const baseLogger = createLogger('backend-integrated');

/**
 * 获取后端基础 logger（service 固定为 backend-integrated）
 */
export function getBackendBaseLogger() {
  return baseLogger;
}

/**
 * 获取带上下文与 traceId 的派生 logger
 * - context：业务上下文（例如模块/功能名）
 * - traceId：链路追踪 ID（来自请求头）
 */
export function getBackendLogger(context?: string, traceId?: string) {
  let logger = baseLogger;
  if (context) {
    logger = logger.child({ context });
  }
  if (traceId) {
    logger = logger.child({ traceId });
  }
  return logger;
}
