import { existsSync } from 'fs';
import { join } from 'path';

import type { Config } from './config';
import { getCliLogger } from './logger';
import { collectThriftFiles } from './utils';

const logger = getCliLogger('diff');

/**
 * 跨版本文件集对比
 * - 对比 src/<module>/vN 与 vN+1 的 .thrift 文件数量
 * - 用于粗粒度发现版本演进差异（详细字段 diff 后续可扩展）
 */
export function diff(root: string, cfg: Config) {
  for (const m of cfg.modules) {
    const src = join(root, m.source);
    const vNext = src.replace(
      `/${cfg.version}`,
      `/v${Number(cfg.version.replace('v', '')) + 1}`
    );
    if (!existsSync(src) || !existsSync(vNext)) {
      logger.info({ module: m.name, src, next: vNext }, 'skip diff');
      continue;
    }
    const a = collectThriftFiles(src).sort();
    const b = collectThriftFiles(vNext).sort();
    logger.info(
      {
        module: m.name,
        version: cfg.version,
        next: vNext.split('/').pop(),
        a: a.length,
        b: b.length,
      },
      'diff summary'
    );
  }
}
