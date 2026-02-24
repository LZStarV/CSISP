import { check } from './check';
import { loadConfig } from './config';
import { diff } from './diff';
import { genTS } from './gen';
import { getCliLogger } from './logger';
import { thriftTypescriptPath, tscPath } from './utils';

/**
 * CLI 入口
 * 支持的子命令：
 * - gen [--ts]：生成类型代码
 * - check：运行非阻断的兼容性与规范检查
 * - diff：对比 vN 与 vN+1 的文件集差异
 * - doctor：输出工具链诊断信息
 */
function main() {
  const logger = getCliLogger('cli');
  const root = process.cwd();
  const cfg = loadConfig();
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'gen') {
    const ts = args.includes('--ts');
    if (ts) genTS(root, cfg);
    if (!ts) {
      genTS(root, cfg);
    }
    return;
  }
  if (cmd === 'check') {
    check(root, cfg);
    return;
  }
  if (cmd === 'diff') {
    diff(root, cfg);
    return;
  }
  if (cmd === 'doctor') {
    logger.info(
      {
        thriftTypescript: thriftTypescriptPath(root),
        tsc: tscPath(),
      },
      'toolchain'
    );
    return;
  }
  logger.info('Usage: idl gen [--ts] | idl check | idl diff | idl doctor');
}

main();
