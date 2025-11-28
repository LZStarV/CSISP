import type { DatabaseInstance, Models } from '../types/models';
import { sequelize, testConnection, syncModels, closeConnection } from '../database';
import { loadModels } from './loaders/loadModels';
import { setupAssociations } from './loaders/setupAssociations';

/**
 * 运行时数据库入口：加载模型、建立关联并导出就绪信号
 */
const models: Record<string, any> = {};

const modelsReady = (async () => {
  const loaded = await loadModels(sequelize);
  const associated = setupAssociations(loaded);
  Object.assign(models, associated);
})();

const dbInstance: DatabaseInstance = {
  sequelize,
  models: models as unknown as Models,
  init: async () => {
    await modelsReady;
    await testConnection();
  },
  close: async () => {
    await closeConnection();
  },
  sync: async (options?: { force?: boolean }) => {
    await syncModels(options?.force ?? false);
  },
};

export { sequelize };
export { modelsReady };
export default models as unknown as Models;
export { dbInstance };
