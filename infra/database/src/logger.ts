// 日志方案概述：
// - 非 development：仅输出 JSON（集中式日志采集使用）
// - development：控制台使用 pino-pretty，美化可读；同时按服务/日期输出到文件
// - 目录结构：<repoRoot>/<LOG_DIR>/development/<service>/<YYYY-MM-DD>.log
// - 环境变量：
//   - LOG_LEVEL：日志级别（默认 info）
//   - LOG_PRETTY_CONSOLE：是否启用控制台 pretty（默认 true）
//   - LOG_TO_FILE：是否写入文件（默认 true）
//   - LOG_DIR：日志根目录（默认 log，相对仓库根）
//   - LOG_RETENTION_DAYS：仅 development 下保留天数（默认 7）
import pino, { type LoggerOptions } from 'pino';
import fs from 'fs';
import path from 'path';
import { findRepoRoot } from '@csisp/utils';

const runtimeEnv = process.env.NODE_ENV || 'development';

// 幂等创建目录
function ensureDir(d: string) {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch {}
}

// 清理过期日志文件（格式 YYYY-MM-DD.log）
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

// 构建 pino LoggerOptions；在 development 环境下可能启用 transport（pretty）
function buildLoggerOptions(service: string): LoggerOptions {
  const level = process.env.LOG_LEVEL || 'info';
  if (runtimeEnv !== 'development') return { level };

  const prettyEnabled = (process.env.LOG_PRETTY_CONSOLE ?? 'true') !== 'false';
  const toFileEnabled = (process.env.LOG_TO_FILE ?? 'true') !== 'false';

  if (!toFileEnabled && prettyEnabled) {
    return {
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', singleLine: true },
      },
    };
  }

  return { level };
}

// 组合 multistream：控制台 pretty 与文件输出（仅 development）
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
        options: { colorize: true, translateTime: 'SYS:standard', singleLine: true },
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
      stream: pino.destination({ dest: filePath, mkdir: true, append: true, sync: false }),
    });
  }

  if (streams.length === 0) return undefined;
  return (pino as unknown as { multistream: (s: any[]) => any }).multistream(streams);
}

// 创建服务级 logger，附带 service 与 env 字段
function createLogger(service: string) {
  const opts = buildLoggerOptions(service);
  const multi = buildMultistream(service);
  const logger = multi ? pino(opts, multi) : pino(opts);
  return logger.child({ service, env: runtimeEnv });
}

const baseLogger = createLogger('infra-database');

// 导出基础 logger（供当前包内各模块复用）
export function getInfraDbLogger() {
  return baseLogger;
}
