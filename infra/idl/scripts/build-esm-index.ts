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
        lines.push(
          `export * from './ts/${projectName}/${version}/${mod}/index.js';`
        );
      }
    }
    const outFile = resolve(outDir, `${projectName}.js`);
    writeFileSync(outFile, lines.join('\n'), 'utf-8');
  }
}

buildAll();
