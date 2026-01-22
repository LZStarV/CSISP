import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

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
  const cwd = process.cwd();
  const root = findRepoRoot(cwd);
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
