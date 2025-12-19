CSISP 项目规则（Trae）

1. 环境与依赖
   - Node.js 使用 `.nvmrc` 指定的 22.x；包管理统一使用 pnpm（根 `package.json` 中的 `packageManager` 为准）。
   - 前端：Vue 3 + Vite + TypeScript + Pinia + Vue Router；后端：Node.js + Koa 2.x + TypeScript + Sequelize；数据库：PostgreSQL 15。

2. 代码与风格
   - 必须使用 TypeScript，避免 `any`（文档或类型声明中已明确允许的除外）。
   - Vue 组件文件使用 PascalCase 命名；后端路由统一以 `/api` 为前缀并遵循 RESTful 设计。
   - 严格遵循 ESLint + Prettier + EditorConfig；在生产代码中避免直接使用 `console.*`，统一使用后端 logger 能力。

3. 测试与验证
   - 测试框架统一使用 Vitest（参见 `tests/` 与各前端子项目配置）；新增或修改核心业务逻辑应同步补充/更新单元测试。
   - 完成改动后至少保证类型检查和 lint 通过；不允许引入新的 TypeScript 编译错误。

4. 限制与约定
   - 不直接访问数据库连接或原生 SQL，统一通过 Sequelize 模型与 Service 层完成数据访问。
   - 不绕过中间件栈（error/cors/logger/rateLimit/jwtAuth/validation/upload）在路由中直接处理跨领域逻辑。
   - 不使用不安全或被禁止的 API（如 `eval`、`Function` 构造器、明文存储密码等）。

5. 文档与协作
   - 所有接口、模型和重要流程必须与 `docs/src/` 中的文档保持一致，如有偏差需同步更新文档。
   - 解释复杂业务时优先在文档中使用 Mermaid（flowchart/sequenceDiagram/erDiagram）补充流程或关系图。
   - 变更范围应可控，不额外引入文档未说明的功能；提交前确保改动可通过项目既有脚本（lint/test/dev）验证。
