import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from '@csisp/utils';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

const logger = createLogger('env-checker');

function parseEnv(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) return new Set();
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const key = trimmed.split('=')[0].trim();
      if (key) keys.add(key);
    }
  }
  return keys;
}

function checkEnv() {
  const envPath = path.join(rootDir, '.env');

  logger.info('正在检查环境变量同步状态...');

  if (!fs.existsSync(envPath)) {
    logger.error(
      '未找到 .env 文件！请从 .env.example 拷贝一份并根据本地环境修改。'
    );
    process.exit(1);
  }

  // 1. 查找项目中所有的 .env.example 文件
  const exampleFiles = globSync('**/.env.example', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  const allRequiredKeys = new Set<string>();
  const keyToSources = new Map<string, string[]>();

  for (const file of exampleFiles) {
    const keys = parseEnv(path.join(rootDir, file));
    keys.forEach(key => {
      allRequiredKeys.add(key);
      const sources = keyToSources.get(key) || [];
      sources.push(file);
      keyToSources.set(key, sources);
    });
  }

  // 2. 获取当前 .env 中的所有 Key
  const envKeys = parseEnv(envPath);

  // 3. 检查缺失
  const missingKeys = Array.from(allRequiredKeys).filter(
    key => !envKeys.has(key)
  );

  if (missingKeys.length > 0) {
    const missingDetails = missingKeys.map(key => ({
      key,
      sources: keyToSources.get(key),
    }));

    logger.warn(
      { missing: missingDetails },
      '注意：你的 .env 文件缺失部分字段，可能会影响项目运行。建议参考对应的 .env.example 同步这些变更。'
    );
  } else {
    logger.info(
      `✅ 环境变量已同步 (已校验 ${exampleFiles.length} 个 .env.example 文件)。`
    );
  }
}

checkEnv();
