## 实施目标

- 在 `apps/backend/src/databases` 建立最小适配层，仅负责用 `src/database.ts` 的 `sequelize` 加载 CLI 模型工厂并执行关联，不复制任何模型；导出 `{ models, modelsReady, sequelize }`。
- 补齐缺失的 ORM 类型（`SubCourse/CourseTeacher/HomeworkFile`）以满足 `ServiceFactory` 依赖。
- 将 `initializeControllers` 的模型来源切换到新入口，保持服务层与 CRUD 逻辑不变。

## 关键文件

- `src/databases/loaders/loadModels.ts`：动态读取 `apps/backend/sequelize/models/*.ts` 并实例化为 ModelStatic。
- `src/databases/loaders/setupAssociations.ts`：遍历执行 `model.associate(models)`。
- `src/databases/index.ts`：组织加载流程，导出 `models` 和 `modelsReady`，提供 `DatabaseInstance` 方法封装（init/sync/close）。

## 类型与对接

- 更新 `src/types/models.ts`：新增 `SubCourseModel`、`CourseTeacherModel`、`HomeworkFileModel`，并加入 `Models` 接口。
- `initControllers` 改为从 `./databases` 导入 `models, modelsReady` 并注册到 `ServiceFactory`。

## 验证

- 全量类型检查，确保与 `@csisp/types` 和现有服务层一致。
- 保持 ESLint 规则，不做自动修复。
- 输出类型兼容性验证报告与数据库目录创建方案文档。

## 交付物

- 完整的 `src/databases` 代码（含 JSDoc）。
- 补齐类型定义后的编译通过。
- 两份文档：方案说明、类型兼容性报告。

如果确认，开始按此方案执行实现与验证。
