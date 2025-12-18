import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件路径（ESM模式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';
let dbConfig: any;
try {
  const configPath = path.resolve(__dirname, '../config/config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  dbConfig = config[env];
} catch {
  process.stderr.write('Failed to load database config\n');
  process.exit(1);
}

const envHost = process.env.DB_HOST;
const envPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const envUser = process.env.DB_USER;
const envPass = process.env.DB_PASSWORD;
const envName = process.env.DB_NAME;
dbConfig = {
  ...dbConfig,
  host: envHost ?? dbConfig.host,
  port: envPort ?? dbConfig.port,
  username: envUser ?? dbConfig.username,
  password: envPass ?? dbConfig.password,
  database: envName ?? dbConfig.database,
};

// 创建 Sequelize 实例
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'postgres',
  logging: dbConfig.logging ?? false,
  benchmark: dbConfig.benchmark ?? false,
  pool: dbConfig.pool ?? { max: 20, min: 5, acquire: 30000, idle: 10000 },
});

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    process.stdout.write('Database connection established\n');
    return true;
  } catch {
    process.stderr.write('Unable to connect to the database\n');
    return false;
  }
}

// 同步数据库模型（开发环境下使用）
async function syncModels(force = false) {
  try {
    await sequelize.sync({ force });
    process.stdout.write('Database models synchronized\n');
    return true;
  } catch {
    process.stderr.write('Failed to synchronize database models\n');
    return false;
  }
}

// 关闭数据库连接
async function closeConnection() {
  try {
    await sequelize.close();
    process.stdout.write('Database connection closed\n');
    return true;
  } catch {
    process.stderr.write('Failed to close database connection\n');
    return false;
  }
}

// 导出数据库连接和工具函数
export { sequelize, testConnection, syncModels, closeConnection };
