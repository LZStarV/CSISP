import fs from 'fs';
import path from 'path';

// 向上查找仓库根目录（存在 pnpm-workspace.yaml 或 .git 的目录）
export function findRepoRoot(startDir: string): string {
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

// 从环境变量中获取必须存在的变量，不存在则抛出错误
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// 从环境变量中获取必须存在的整数变量，不存在或不是整数则抛出错误
export function requireIntEnv(name: string): number {
  const raw = requireEnv(name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid environment variable: ${name}=${raw}`);
  }
  return value;
}

// 获取给前端使用的环境变量
export function getFrontendEnv(_mode?: string): Record<string, string> {
  const filtered: Record<string, string> = {};
  const allowedPrefix = 'CSISP_';

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(allowedPrefix)) {
      filtered[key] = value as string;
    }
  }

  return filtered;
}
