/**
 * 建立所有模型之间的关联
 * @param models 模型映射对象
 * @returns 传入的模型映射（便于链式使用）
 */
export function setupAssociations(models: Record<string, any>): Record<string, any> {
  Object.keys(models).forEach(name => {
    process.stdout.write(`associate:${name}\n`);
    const model = (models as any)[name];
    if (model && typeof model.associate === 'function') {
      try {
        model.associate(models);
      } catch (e: any) {
        const msg = e?.message ?? '';
        if (e?.name === 'SequelizeAssociationError' && msg.includes('must have unique aliases')) {
          return;
        }
        throw e;
      }
    }
  });
  return models;
}
