import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';

function ensureDir(p: string) {
  mkdirSync(p, { recursive: true });
}

function listDirs(p: string) {
  return readdirSync(p, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function listThriftModules(p: string) {
  return readdirSync(p, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith('.thrift'))
    .map(f => f.name.replace(/\.thrift$/, ''));
}

function buildAll() {
  const srcRoot = resolve(__dirname, '../src');
  const esmTsRoot = resolve(__dirname, '../dist/esm/ts');
  const outDir = resolve(__dirname, '../dist/esm');
  ensureDir(outDir);
  const projects = listDirs(srcRoot);
  for (const projectName of projects) {
    const versionsRoot = resolve(srcRoot, projectName);
    const versions = listDirs(versionsRoot);
    const lines: string[] = [];
    for (const version of versions) {
      const versionDir = resolve(versionsRoot, version);
      const modules = listThriftModules(versionDir);
      for (const mod of modules) {
        const modOutDir = resolve(esmTsRoot, projectName, version, mod);
        // 优先导出模块 index.js
        lines.push(
          `export * from './ts/${projectName}/${version}/${mod}/index.js';`
        );
        // 逐文件补充导出，避免模块 index 未覆盖全部成员
        for (const f of readdirSync(modOutDir, { withFileTypes: true })) {
          if (f.isFile() && f.name.endsWith('.js') && f.name !== 'index.js') {
            lines.push(
              `export * from './ts/${projectName}/${version}/${mod}/${f.name}';`
            );
          }
        }
      }
    }
    const outFile = resolve(outDir, `${projectName}.js`);
    writeFileSync(outFile, lines.join('\n'), 'utf-8');
  }
}

buildAll();
