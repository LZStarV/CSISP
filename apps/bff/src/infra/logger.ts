// 日志方案概述：
// - 非 development：输出 JSON 以供集中式采集
// - development：控制台使用 pino-pretty，同时写入文件（按服务/日期分文件）
// - 目录结构：<repoRoot>/<LOG_DIR>/development/<service>/<YYYY-MM-DD>.log
// - 环境变量：
//   - LOG_LEVEL（默认 info）
//   - LOG_PRETTY_CONSOLE（默认 true）
//   - LOG_TO_FILE（默认 true）
//   - LOG_DIR（默认 log，相对仓库根）
//   - LOG_RETENTION_DAYS（默认 7，仅 development）
import fs from 'fs';
import path from 'path';

import { findRepoRoot } from '@csisp/utils';
import type { Context } from 'koa';
import pino, { type LoggerOptions } from 'pino';

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

// 创建服务级 logger，附带 service 与 env 字段
function createLogger(service: string) {
  const opts = buildLoggerOptions(service);
  const multi = buildMultistream(service);
  const logger = multi ? pino(opts, multi) : pino(opts);
  return logger.child({ service, env: runtimeEnv });
}

const baseLogger = createLogger('bff');

export function getBaseLogger() {
  return baseLogger;
}

// 为请求附加 traceId 子字段（若中间件已设置 ctx.state.traceId）
export function getRequestLogger(ctx: Context) {
  const traceId = (ctx.state as any)?.traceId;
  return traceId ? baseLogger.child({ traceId }) : baseLogger;
}
