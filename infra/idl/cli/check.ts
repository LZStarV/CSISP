import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import type { Config } from './config';
import { getCliLogger } from './logger';
import { collectThriftFiles } from './utils';

const logger = getCliLogger('check');

/**
 * 兼容性与规范检查（非阻断）
 * - 检测字段 ID 重复
 * - 检测 required 字段（提示新增字段优先使用 optional）
 */
export function check(root: string, cfg: Config) {
  let warnings = 0;
  for (const m of cfg.modules) {
    const src = join(root, m.source);
    if (!existsSync(src)) continue;
    const files = collectThriftFiles(src);
    for (const f of files) {
      const text = readFileSync(f, 'utf-8');
      const ids = new Set<number>();
      const lines = text.split('\n');
      for (const line of lines) {
        const mm = /^\s*(\d+):\s*(required|optional)?\s*\w+/.exec(line);
        if (mm) {
          const id = Number(mm[1]);
          if (ids.has(id)) {
            logger.warn({ file: f, id }, 'duplicate field id');
            warnings++;
          } else {
            ids.add(id);
          }
          if (mm[2] === 'required') {
            logger.info({ file: f }, 'required field detected');
          }
        }
      }
    }
  }
  logger.info({ warnings }, 'check finished');
}
