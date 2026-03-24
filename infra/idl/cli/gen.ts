import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';

import type { Config } from './config';
import { getCliLogger } from './logger';
import {
  collectThriftFiles,
  runBin,
  thriftTypescriptPath,
  tscPath,
} from './utils';

const logger = getCliLogger('gen');

/**
 * 生成 TypeScript 类型代码
 * - 使用 @creditkarma/thrift-typescript
 * - 输出目录遵循脚本约定：.generated/ts/<module>
 * - 生成后自动创建聚合入口并执行 tsc 编译
 */
export function genTS(root: string, cfg: Config) {
  const bin = thriftTypescriptPath(root);
  for (const m of cfg.modules) {
    const src = join(root, m.source);
    const out = join(root, m.tsOut);
    if (!existsSync(src)) continue;
    mkdirSync(out, { recursive: true });
    const files = collectThriftFiles(src).map(f => basename(f));
    if (files.length === 0) continue;
    runBin(
      bin,
      [
        '--sourceDir',
        '.',
        '--outDir',
        out,
        '--target',
        'thrift-server',
        ...files,
      ],
      src
    );
    logger.info({ module: m.name, out }, 'ts generated');
  }
  genAggregators(root, cfg);
  runBin(tscPath(), ['-p', join(root, 'tsconfig.json')], root);
}

/**
 * 生成 .generated 聚合入口
 * - backoffice.ts / backend.ts / idp.ts
 * - 供 tsc 编译生成 dist/<module>.{js,d.ts}
 */
export function genAggregators(root: string, cfg: Config) {
  const genRoot = resolve(root, '.generated');
  mkdirSync(genRoot, { recursive: true });
  const aggPaths = {
    backoffice: resolve(genRoot, 'backoffice.ts'),
    backend: resolve(genRoot, 'backend.ts'),
    idp: resolve(genRoot, 'idp.ts'),
    index: resolve(genRoot, 'index.ts'),
  };
  writeFileSync(aggPaths.backoffice, 'export {}\n');
  writeFileSync(aggPaths.backend, 'export {}\n');
  writeFileSync(aggPaths.idp, 'export {}\n');
  writeFileSync(aggPaths.index, '');
  for (const m of cfg.modules) {
    const baseGenTs = resolve(root, m.tsOut);
    const srcDir = resolve(root, m.source);
    if (!existsSync(srcDir) || !existsSync(baseGenTs)) continue;
    const subdirs = readdirSync(baseGenTs, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const sub of subdirs) {
      const line = `export * from './${m.name}/${sub}';
`;
      if (m.name === 'backoffice' && sub !== 'backoffice') {
        writeFileSync(aggPaths.backoffice, line, { flag: 'a' });
      } else if (m.name === 'backend') {
        writeFileSync(aggPaths.backend, line, { flag: 'a' });
      } else if (m.name === 'idp') {
        writeFileSync(aggPaths.idp, line, { flag: 'a' });
      }
    }
  }
  writeFileSync(
    aggPaths.index,
    `import * as backoffice from './backoffice';
    import * as backend from './backend';
    import * as idp from './idp';
    export { backoffice, backend, idp };
    `,
    { flag: 'w' }
  );
}
