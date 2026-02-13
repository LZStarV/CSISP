import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import type { Config } from './config';
import { getCliLogger } from './logger';
import {
  collectThriftFiles,
  runBin,
  thriftPath,
  thriftTypescriptPath,
  tscPath,
} from './utils';

const logger = getCliLogger('gen');

/**
 * 生成 TypeScript 类型代码
 * - 使用 @creditkarma/thrift-typescript
 * - 输出目录遵循脚本约定：.generated/ts/<module>/vN
 * - 生成后自动创建聚合入口并执行 tsc 编译
 */
export function genTS(root: string, cfg: Config) {
  const bin = thriftTypescriptPath(root);
  for (const m of cfg.modules) {
    const src = join(root, m.source);
    const out = join(root, m.tsOut);
    if (!existsSync(src)) continue;
    mkdirSync(out, { recursive: true });
    const files = collectThriftFiles(src).map(f =>
      join('.', f.split('/').pop() as string)
    );
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
 * 生成 Node.js 运行时代码（JS）
 * - 使用 Apache Thrift 编译器（thrift -r --gen js:node）
 * - 输出目录遵循脚本约定：dist/js/<module>/vN
 */
export function genJS(root: string, cfg: Config) {
  const bin = thriftPath();
  for (const m of cfg.modules) {
    const src = join(root, m.source);
    const out = join(root, m.jsOut);
    if (!existsSync(src)) continue;
    mkdirSync(out, { recursive: true });
    const files = collectThriftFiles(src);
    for (const f of files) {
      runBin(bin, ['-r', '--gen', 'js:node', '-out', out, f], root);
    }
    logger.info({ module: m.name, out }, 'js generated');
  }
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
  };
  writeFileSync(aggPaths.backoffice, '');
  writeFileSync(aggPaths.backend, '');
  writeFileSync(aggPaths.idp, '');
  for (const m of cfg.modules) {
    const baseGenTs = resolve(root, m.tsOut);
    if (!existsSync(baseGenTs)) continue;
    const subdirs = readdirSync(baseGenTs, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const sub of subdirs) {
      const line = `export * from './ts/${m.name}/${cfg.version}/${sub}';
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
}
