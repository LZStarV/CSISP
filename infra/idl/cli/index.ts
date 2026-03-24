import { loadConfig } from './config';
import { genTS } from './gen';

/**
 * CLI 入口
 */
function main() {
  const root = process.cwd();
  const cfg = loadConfig();
  genTS(root, cfg);
}

main();
