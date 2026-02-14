import { createLogger } from '@csisp/utils';

/**
 * 获取 CLI Logger
 * - 可通过 context 指定日志上下文标签（例如命令名）
 */
export function getCliLogger(context?: string) {
  const base = createLogger('idl-cli', { level: 'info' });
  return context ? base.child({ context }) : base;
}
