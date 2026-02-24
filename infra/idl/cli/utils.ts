import { spawnSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

import { getCliLogger } from './logger';

const logger = getCliLogger('utils');

/**
 * 执行外部命令（同步）
 * - 失败时记录错误并抛出异常
 * - Windows 使用 shell 模式以正确处理 .bin 脚本
 */
export function runBin(bin: string, args: string[], cwd: string) {
  const isWindows = process.platform === 'win32';
  const res = spawnSync(bin, args, {
    stdio: 'inherit',
    cwd,
    shell: isWindows,
  });
  if (res.status !== 0) {
    logger.error({ bin, args, cwd, code: res.status }, 'exec failed');
    throw new Error(`${bin} failed with code ${res.status}`);
  }
}

/** 获取 thrift-typescript 可执行路径（优先使用本包 node_modules/.bin） */
export function thriftTypescriptPath(root: string) {
  return resolve(root, 'node_modules/.bin/thrift-typescript');
}

/** 获取 tsc 执行命令（依赖 workspace 提供） */
export function tscPath() {
  return 'tsc';
}

/** 收集指定目录下的 .thrift 文件列表 */
export function collectThriftFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.thrift'))
    .map(f => join(dir, f));
}
