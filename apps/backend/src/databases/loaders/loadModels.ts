import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import type { Models } from '../../types/models';

/**
 * 加载 CLI 模型工厂并使用运行时 sequelize 实例进行初始化
 * @param sequelize Sequelize 实例（来自 src/database.ts）
 * @returns 已实例化的模型映射对象
 */
export async function loadModels(sequelize: Sequelize): Promise<Record<string, any>> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const modelsDir = path.resolve(__dirname, '../../../sequelize/models');

  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

  const models: Record<string, any> = {};

  for (const file of files) {
    const fullPath = path.resolve(modelsDir, file);
    const mod = await import(fullPath);
    const factory = mod.default;
    const model = factory(sequelize, DataTypes);
    models[model.name] = model;
  }

  return models as unknown as Models;
}
