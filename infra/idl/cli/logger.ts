import pino, { type LoggerOptions } from 'pino';

/**
 * CLI 日志模块（pino）
 * 说明：
 * - 默认输出 JSON 结构日志，便于在 CI 或终端中检视
 * - 在开发环境下，当启用 LOG_PRETTY_CONSOLE（默认 true）时，使用 pino-pretty 美化输出（彩色、单行）
 * - 为避免 CLI 写入文件引入 IO 复杂度，这里不启用文件输出；若需要后续可按环境变量扩展
 */
function buildLoggerOptions(): LoggerOptions {
  const level = process.env.IDL_LOG_LEVEL || process.env.LOG_LEVEL || 'info';
  const env = process.env.NODE_ENV || 'development';
  if (env !== 'development') return { level };

  const prettyEnabled = (process.env.LOG_PRETTY_CONSOLE ?? 'true') !== 'false';
  if (prettyEnabled) {
    return {
      level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: true,
        },
      },
    };
  }
  return { level };
}

/**
 * 获取 CLI Logger
 * - 可通过 context 指定日志上下文标签（例如命令名）
 */
export function getCliLogger(context?: string) {
  const opts = buildLoggerOptions();
  const base = pino(opts);
  return context ? base.child({ context }) : base;
}
