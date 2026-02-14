import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

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

// 加载仓库根目录下的 .env 文件（如果存在）
export function loadRootEnv(): void {
  try {
    // 如果已经加载过（例如通过 dotenv-cli），则跳过，除非需要支持变量扩展
    // 实际上 dotenv.config() 会加载到 process.env，expand 会处理它
    const cwd = process.cwd();
    const root = findRepoRoot(cwd);
    const envPath = path.join(root, '.env');

    if (fs.existsSync(envPath)) {
      // 强制覆盖已有的环境变量，以便支持变量扩展（针对 dotenv-cli 加载的情况）
      const env = dotenv.config({ path: envPath, override: true });
      expand(env);
    }
  } catch (error) {
    console.error('Failed to load root .env:', error);
  }
}

/**
 * 获取给前端 Vite 使用的环境变量
 * 过滤出以 VITE_ 或 CSISP_ 开头的变量
 */
export function getFrontendEnv(
  mode: string = 'development'
): Record<string, string> {
  const root = findRepoRoot(process.cwd());
  const envPath = path.join(root, '.env');
  const modeEnvPath = path.join(root, `.env.${mode}`);

  const envs: Record<string, string>[] = [];

  // 1. 加载基础 .env
  if (fs.existsSync(envPath)) {
    const baseEnv = dotenv.config({ path: envPath, override: true });
    expand(baseEnv);
    if (baseEnv.parsed) envs.push(baseEnv.parsed);
  }

  // 2. 加载模式特定的 .env (如 .env.production)
  if (fs.existsSync(modeEnvPath)) {
    const modeEnv = dotenv.config({ path: modeEnvPath, override: true });
    expand(modeEnv);
    if (modeEnv.parsed) envs.push(modeEnv.parsed);
  }

  // 3. 合并并过滤前缀
  const merged = Object.assign({}, ...envs);
  const filtered: Record<string, string> = {};

  const allowedPrefixes = ['VITE_', 'CSISP_'];

  for (const [key, value] of Object.entries(merged)) {
    if (allowedPrefixes.some(prefix => key.startsWith(prefix))) {
      filtered[key] = value as string;
    }
  }

  return filtered;
}
