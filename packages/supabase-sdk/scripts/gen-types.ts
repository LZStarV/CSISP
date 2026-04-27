#!/usr/bin/env tsx

/**
 * Supabase 类型生成脚本
 *
 * 用途：从 Supabase 数据库 Schema 生成 TypeScript 类型定义
 * 使用方法：
 *   pnpm gen:types              # 从 staging 环境生成（默认）
 *   pnpm gen:types --env local  # 从本地开发环境生成
 *
 * 依赖：
 * - Supabase CLI (npm install -g supabase)
 * - Infisical CLI (用于注入环境变量)
 */

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_DIR = join(__dirname, '..');

function log(message: string): void {
  process.stdout.write(message + '\n');
}

function error(message: string): void {
  process.stderr.write(message + '\n');
}

// 解析命令行参数
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const env =
  envIndex !== -1 && args[envIndex + 1] ? args[envIndex + 1] : 'staging';

// 验证环境参数
const validEnvs = ['staging', 'local'];
if (!validEnvs.includes(env)) {
  error(`Error: invalid environment "${env}"`);
  error(`Valid options: ${validEnvs.join(', ')}`);
  process.exit(1);
}

log('Supabase Type Generator');
log('========================');
log(`Target environment: ${env}`);
log('');

// 检查是否已安装必要的 CLI 工具
function checkCommand(cmd: string, installHint: string): void {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
  } catch {
    error(`Error: command not found - ${cmd}`);
    error(`Please install: ${installHint}`);
    process.exit(1);
  }
}

checkCommand('supabase', 'npm install -g supabase');
checkCommand('prettier', 'pnpm install -g prettier');

if (env !== 'local') {
  checkCommand(
    'infisical',
    'Please refer to Infisical documentation for CLI installation'
  );
}

log(`Working directory: ${PACKAGE_DIR}`);
log('');

log('Starting type generation...');
log('');

try {
  let genCommand: string;

  if (env === 'local') {
    log('Generating from local Supabase instance...');
    genCommand = 'supabase gen types typescript --local > src/types/type.ts';
  } else {
    log(`Generating from Supabase cloud (environment: ${env})...`);
    genCommand = `infisical run --env ${env} -- sh -c 'supabase gen types typescript --project-id "$SUPABASE_URL_REF" --schema public > src/types/type.ts'`;
  }

  execSync(genCommand, {
    cwd: PACKAGE_DIR,
    stdio: 'inherit',
  });

  log('');
  log('Formatting type file...');

  execSync('pnpm format:types', {
    cwd: PACKAGE_DIR,
    stdio: 'inherit',
  });

  log('');
  log('Type generation complete!');
  log('');
  log(`Output: ${PACKAGE_DIR}/src/types/type.ts`);
  log('');
  log('Usage:');
  log('  import type { Database } from "@csisp/supabase-sdk";');
  log("  type User = Database['public']['Tables']['user']['Row'];");
  log('');

  if (env !== 'local') {
    log('Note: Please commit the updated type file to Git:');
    log('  git add packages/supabase-sdk/src/types/type.ts');
    log(`  git commit -m "chore: regenerate types from ${env}"`);
    log('');
  }
} catch (err) {
  error(`Error: generation failed - ${(err as Error).message}`);
  process.exit(1);
}
