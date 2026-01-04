import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

export function loadRootEnv() {
  const cwd = process.cwd();
  const root = findRepoRoot(cwd);
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
