import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';

import { getDbConfig } from '../config/db-env';
import { getInfraDbLogger } from '../logger';
import { migrateUpAll, closeSequelize } from '../migration-runner';
import { registerSpecModels } from '../spec/register';

type Diff = { table: string; issue: string };

function normalizeType(t: string): string {
  let str = t.toLowerCase();
  str = str.replace('character varying', 'varchar');
  str = str.replace('timestamp with time zone', 'timestamptz');
  str = str.replace('double precision', 'double');
  return str;
}

function normalizeDefault(v: unknown): string {
  if (v == null) return '';
  const s = String(v).toLowerCase();
  if (s.includes('nextval(')) return 'auto-increment';
  if (s.includes('now()') || s.includes('current_timestamp')) return 'now';
  return s;
}

async function checkSchemaConsistency(): Promise<void> {
  const logger = getInfraDbLogger();
  const cfg = getDbConfig();
  logger.info(
    { host: cfg.host, port: cfg.port, db: cfg.database },
    '开始进行数据库结构一致性检查'
  );
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    logging: false,
    define: { underscored: true },
    timezone: '+08:00',
  });

  registerSpecModels(sequelize);
  const qi = sequelize.getQueryInterface();
  const diffs: Diff[] = [];

  for (const model of sequelize.modelManager.models) {
    const table = model.getTableName() as string;
    logger.info({ table }, '检查表结构');
    let actual: Record<string, any> | null = null;
    try {
      actual = await qi.describeTable(table);
    } catch {
      const issue = 'missing-table';
      logger.error({ table, issue }, '数据库中缺少该表');
      diffs.push({ table, issue });
      continue;
    }

    const entries = Object.entries(model.rawAttributes) as Array<[string, any]>;

    const expectedPk = entries
      .filter(([, a]) => a.primaryKey)
      .map(([key, a]) => (a.field || key) as string)
      .sort();
    const actualPk = Object.entries(actual)
      .filter(([, a]) => (a as any).primaryKey)
      .map(([col]) => col)
      .sort();
    if (expectedPk.join(',') !== actualPk.join(',')) {
      const issue = `primary-key-mismatch:${actualPk.join('|')}!=${expectedPk.join('|')}`;
      logger.error({ table, issue }, '主键集合不一致');
      diffs.push({ table, issue });
    }

    for (const [key, attr] of entries) {
      const col = (attr.field || key) as string;
      const actualCol = (actual as any)[col];
      if (!actualCol) {
        const issue = `missing-column:${col}`;
        logger.error({ table, issue }, '数据库中缺少目标态列');
        diffs.push({ table, issue });
        continue;
      }
      const expectedType = normalizeType(attr.type.toString());
      const actualType = normalizeType(actualCol.type);
      if (!actualType.includes(expectedType)) {
        const issue = `type-mismatch:${col}:${actualCol.type}!=${attr.type}`;
        logger.error(
          { table, issue, expectedType, actualType },
          '列类型不一致'
        );
        diffs.push({ table, issue });
      }
      const expectedNull = Boolean(attr.allowNull);
      const actualNull = Boolean(actualCol.allowNull);
      if (expectedNull !== actualNull) {
        const issue = `nullability-mismatch:${col}:${actualNull}!=${expectedNull}`;
        logger.error({ table, issue }, '列可空性不一致');
        diffs.push({ table, issue });
      }
      let expectedDefault = '';
      if (attr.autoIncrement) {
        expectedDefault = 'auto-increment';
      } else if (
        Object.prototype.hasOwnProperty.call(attr, 'defaultValue') &&
        attr.defaultValue != null
      ) {
        expectedDefault = normalizeDefault(attr.defaultValue);
      }
      const actualDefault = normalizeDefault(actualCol.defaultValue);
      if (expectedDefault !== '' && expectedDefault !== actualDefault) {
        const issue = `default-mismatch:${col}:${actualDefault}!=${expectedDefault}`;
        logger.error({ table, issue }, '列默认值不一致');
        diffs.push({ table, issue });
      }
    }

    for (const actualColName of Object.keys(actual)) {
      const hasSpec = entries.some(
        ([key, a]) => (a.field || key) === actualColName
      );
      if (!hasSpec) {
        const issue = `unexpected-column:${actualColName}`;
        logger.error({ table, issue }, '数据库存在目标态未声明的列');
        diffs.push({ table, issue });
      }
    }

    const idx = (await qi.showIndex({ tableName: table })) as any[];
    const actualUniqueCols = new Set<string>();
    for (const i of idx) {
      if ((i as any).unique && Array.isArray((i as any).fields)) {
        for (const f of (i as any).fields) {
          const colName =
            (f as any).attribute ||
            (f as any).name ||
            (f as any).column ||
            (f as any).value;
          if (typeof colName === 'string') {
            actualUniqueCols.add(colName);
          }
        }
      }
    }
    const uqRows = (await sequelize.query(
      `
        SELECT att.attname AS column_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE con.contype = 'u' AND rel.relname = :table
      `,
      { replacements: { table }, type: 'SELECT' as any }
    )) as any[];
    if (Array.isArray(uqRows)) {
      for (const r of uqRows as any[]) {
        const col = (r as any).column_name;
        if (typeof col === 'string') actualUniqueCols.add(col);
      }
    }
    const expectedUniqueCols = entries
      .filter(([, a]) => Boolean(a.unique))
      .map(([key, a]) => (a.field || key) as string);
    for (const col of expectedUniqueCols) {
      if (!actualUniqueCols.has(col)) {
        const issue = `missing-unique-index:${col}`;
        logger.error({ table, issue }, '缺少唯一索引约束');
        diffs.push({ table, issue });
      }
    }
  }

  await sequelize.close();

  if (diffs.length > 0) {
    const msg = diffs.map(d => `${d.table} -> ${d.issue}`).join('\n');
    throw new Error(`Schema consistency check failed:\n${msg}`);
  }
}

async function main() {
  const logger = getInfraDbLogger();
  try {
    await migrateUpAll();
    await checkSchemaConsistency();
    logger.info('数据库结构与目标态一致，检查通过');
  } catch (e) {
    getInfraDbLogger().error({ err: e }, '数据库结构一致性检查失败');
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

void main();
