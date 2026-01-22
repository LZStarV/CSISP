import fs from 'fs';
import path from 'path';

import { findRepoRoot } from '@csisp/utils';
import pino, { type LoggerOptions } from 'pino';

const runtimeEnv = process.env.NODE_ENV || 'development';

/**
 * 递归创建目录，存在则忽略错误。
 */
function ensureDir(d: string) {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch {}
}

/**
 * 清理过期日志文件（形如 YYYY-MM-DD.log），根据保留天数删除历史文件。
 */
function cleanupOldLogs(dir: string, retentionDays: number) {
  try {
    const files = fs.readdirSync(dir);
    const now = Date.now();
    const keepMs = retentionDays * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (!/^\d{4}-\d{2}-\d{2}\.log$/.test(f)) continue;
      const parts = f
        .slice(0, 10)
        .split('-')
        .map(n => Number(n));
      const dt = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      if (Number.isFinite(dt) && now - dt > keepMs) {
        try {
          fs.unlinkSync(path.join(dir, f));
        } catch {}
      }
    }
  } catch {}
}

/**
 * 构建 pino 的基础配置。
 * 说明：
 * - 非开发环境：仅设置 level
 * - 开发环境：当启用 pretty 且禁用文件输出时，使用 pino-pretty 进行美化输出
 * 注意：
 * - 该函数不依赖 service 名称，因此不需要传入 service 参数
 */
function buildLoggerOptions(): LoggerOptions {
  const level = process.env.LOG_LEVEL || 'info';
  if (runtimeEnv !== 'development') return { level };

  const prettyEnabled = (process.env.LOG_PRETTY_CONSOLE ?? 'true') !== 'false';
  const toFileEnabled = (process.env.LOG_TO_FILE ?? 'true') !== 'false';

  if (!toFileEnabled && prettyEnabled) {
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
 * 在开发环境下构建多路输出：
 * - 控制台美化（pino-pretty）
 * - 文件输出（按 env/service/日期 划分），并进行日志留存清理
 * 生产环境下不启用多路输出，避免额外 IO
 */
function buildMultistream(service: string): any | undefined {
  if (runtimeEnv !== 'development') return undefined;
  const level = process.env.LOG_LEVEL || 'info';
  const prettyEnabled = (process.env.LOG_PRETTY_CONSOLE ?? 'true') !== 'false';
  const toFileEnabled = (process.env.LOG_TO_FILE ?? 'true') !== 'false';

  const streams: any[] = [];
  if (prettyEnabled) {
    streams.push({
      level,
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: true,
        },
      }) as any,
    });
  }
  if (toFileEnabled) {
    const repoRoot = findRepoRoot(process.cwd());
    const logDir = path.resolve(repoRoot, process.env.LOG_DIR || 'log');
    const envDir = path.join(logDir, runtimeEnv);
    const serviceDir = path.join(envDir, service);
    ensureDir(serviceDir);

    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const filePath = path.join(serviceDir, `${yyyy}-${mm}-${dd}.log`);

    const retentionDays = Number(process.env.LOG_RETENTION_DAYS ?? 7);
    if (retentionDays > 0) cleanupOldLogs(serviceDir, retentionDays);

    streams.push({
      level,
      stream: pino.destination({
        dest: filePath,
        mkdir: true,
        append: true,
        sync: false,
      }),
    });
  }

  if (streams.length === 0) return undefined;
  return (pino as unknown as { multistream: (s: any[]) => any }).multistream(
    streams
  );
}

/**
 * 创建带服务标识与环境信息的 logger。
 * - 在开发环境下可能带多路输出；生产环境下为单路输出
 */
export function createLogger(service: string) {
  const opts = buildLoggerOptions();
  const multi = buildMultistream(service);
  const logger = multi ? pino(opts, multi) : pino(opts);
  return logger.child({ service, env: runtimeEnv });
}

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
