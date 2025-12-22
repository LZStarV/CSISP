import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { DataTypes, Sequelize } from 'sequelize';

export type LoadedModels = Record<string, any>;

/**
 * 加载 Sequelize 模型并建立关联。
 */
export async function loadModelsAndAssociations(sequelize: Sequelize): Promise<LoadedModels> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const modelsDir = path.resolve(__dirname, 'models');
  const files = fs
    .readdirSync(modelsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts');

  const models: LoadedModels = {};

  // 1) 实例化所有模型
  for (const file of files) {
    const fullPath = path.resolve(modelsDir, file);
    const moduleUrl = pathToFileURL(fullPath).href;
    const mod = await import(moduleUrl);
    const factory = mod.default as (seq: Sequelize, types: typeof DataTypes) => any;
    const model = factory(sequelize, DataTypes);
    models[model.name] = model;
  }

  // 2) 建立模型关联（如果定义了 associate）
  Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    if (model && typeof (model as any).associate === 'function') {
      (model as any).associate(models);
    }
  });

  return models;
}
