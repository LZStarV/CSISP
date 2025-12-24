import pino, { type LoggerOptions } from 'pino';
import fs from 'fs';
import path from 'path';

// 开发环境文件日志方案：
// - 在 development 环境，日志同时输出到控制台（pino-pretty）与文件（按服务/日期分文件）
// - 目录结构：log/<env>/<service>/<YYYY-MM-DD>.log
// - 可通过环境变量开关/配置：LOG_TO_FILE/LOG_DIR/LOG_RETENTION_DAYS/LOG_PRETTY_CONSOLE

const runtimeEnv = process.env.NODE_ENV || 'development';

// 递归向上查找仓库根目录（pnpm-workspace.yaml 或 .git）
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    const workspace = path.join(dir, 'pnpm-workspace.yaml');
    const git = path.join(dir, '.git');
    if (fs.existsSync(workspace) || fs.existsSync(git)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

// 确保目录存在（幂等）
function ensureDir(d: string) {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch {}
}

// 按保留期清理旧的 <YYYY-MM-DD>.log 文件（仅 development 使用）
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

// 构建 pino LoggerOptions：
// - 非 development：仅设置 level，保持 JSON 输出（供集中式日志）
// - development：若仅控制台 pretty，则使用 transport；其余由 multistream 处理
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

  // 其他情况仅返回 level，实际输出通过 multistream 组合
  return { level };
}

// 计算 multistream：组合控制台 pretty 与文件输出（仅 development）
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

// 创建服务级 logger：按服务名决定文件路径与子字段
export function createLogger(service: string) {
  const opts = buildLoggerOptions(service);
  const multi = buildMultistream(service);
  const logger = multi ? pino(opts, multi) : pino(opts);
  return logger.child({ service, env: runtimeEnv });
}

export const logger = createLogger('root');
