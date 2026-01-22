import { spawnSync } from 'child_process';
import path from 'path';

import { loadRootEnv } from '@csisp/utils';

import { createLogger } from '../src/infra/logger';

loadRootEnv();

// 代码生成脚本无需落文件日志，避免进程退出的文件流冲突
process.env.LOG_TO_FILE = process.env.LOG_TO_FILE ?? 'false';

// 数据库连接配置（优先使用 DATABASE_URL，其次拼接参数）
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5433';
const database = process.env.DB_NAME || 'csisp';
const user = process.env.DB_USER || 'admin';
const password = process.env.DB_PASSWORD || 'replace-me';
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

// 执行 kanel 生成类型到 src/infra/postgres/generated
const kanelBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'kanel');
const result = spawnSync(
  kanelBin,
  ['-d', connectionString, '-o', 'src/infra/postgres/generated'],
  {
    stdio: 'inherit',
  }
);

// 统一错误输出到本地 logger，并用 exitCode 表示结果
if (result.error) {
  const logger = createLogger('backend-integrated-codegen');
  logger.error({ err: result.error }, 'kanel execution failed');
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 0;
}
