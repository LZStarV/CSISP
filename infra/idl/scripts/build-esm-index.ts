import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
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
        // 仅导出模块 index.js，避免同名 Service 元数据冲突
        lines.push(
          `export * from './ts/${projectName}/${version}/${mod}/index.js';`
        );
        // 如果存在与模块同名的文件（通常包含 Service 定义），则导出命名空间对象
        const modFile = resolve(
          esmTsRoot,
          projectName,
          version,
          mod,
          `${mod}.js`
        );
        if (existsSync(modFile)) {
          lines.push(
            `import * as ${mod} from './ts/${projectName}/${version}/${mod}/${mod}.js';`,
            `export { ${mod} };`
          );
        }
      }
    }
    const outFile = resolve(outDir, `${projectName}.js`);
    writeFileSync(outFile, lines.join('\n'), 'utf-8');
  }
}

buildAll();
