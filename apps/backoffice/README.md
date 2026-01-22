# CSISP Backoffice 项目说明

**项目概览**

- 该项目是后台管理界面（Backoffice），面向内部管理与只读数据查看（用户、日志、数据库等）。
- 采用 Next.js App Router + Ant Design；服务端以 JSON-RPC 风格统一入口与错误编码，并可生成契约文档。
- 模块按“三件套”组织（controller/service/module），通过注册器聚合到统一分发入口。

**目录结构**

- app：路由层（Next App Router）
  - (admin)/layout.tsx：后台共享布局（Header/Aside/PageShell）
  - (admin)/user-center/page.tsx、logs-manage/page.tsx、db-manage/page.tsx
  - (auth)/layout.tsx、(auth)/login/page.tsx：独立登录布局与页面
  - api/backoffice/[domain]/[action]/route.ts：JSON-RPC 动态路由入口（统一 HTTP 200）
  - api/backoffice/openrpc/route.ts：OpenRPC 文档端点（内部）
  - api/backoffice/health/route.ts：基础设施健康检查端点（暂不鉴权，后续限制）
- src/server：服务端业务与治理
  - modules/\*：领域模块三件套（controller/service/module），index.ts 聚合与文档生成
  - rpc/dispatcher.ts、rpc/registry.ts：分发器与注册器
  - middleware/\*：通用中间件（errorWrapper/logger/trace/jwtAuth/roles/rateLimit/responseValidation）
  - config/\*：环境配置与 RPC 常量
- src/infra：基础设施与依赖封装
  - postgres/：Sequelize + 只读模型注册；generated/public/\* 为 Kanel 生成的类型（作为字段参照）
  - redis/：连接封装与统一限流实现（滑窗，支持阈值配置与内存回退）
  - mongo/：Mongoose 连接与占位 schemas（i18n/log）
- src/shared/config/jsonrpc：JSON-RPC 辅助（codes/helpers/types）
- scripts/run-kanel.ts：类型生成脚本，输出到 src/infra/postgres/generated/public

**RPC 规范**

- 路由格式：POST /api/backoffice/:domain/:action
  - 请求体需包含 method，且与 :action 一致；params 为方法参数，id 可选
- 响应（JSON-RPC 2.0）
  - 成功：{ jsonrpc: '2.0', id, result }
  - 失败：{ jsonrpc: '2.0', id, error: { code, message, data? } }
  - 错误编码由 shared/config/jsonrpc/codes.ts 定义（InvalidRequest/MethodNotFound/InvalidParams/InternalError）
- 文档端点（OpenRPC）
  - GET /api/backoffice/openrpc.json（内部使用）
  - 文档由 modules 的 schemas 聚合生成（含 summary/params/result 简化说明）

**中间件与治理**

- errorWrapper：统一将错误映射为 JSON-RPC 错误对象，保持 HTTP 200
- logger：结构化日志（context=rpc/http、method/domain/action、status、duration、traceId）
- trace：生成或透传 X-Trace-Id，写入 ctx 并用于日志链路
- jwtAuth/roles：鉴权与角色控制（controller 可执行 admin-only 业务校验）
- rateLimit：滑窗限流（默认按 ip+path），优先 Redis，自动回退为内存计数
- responseValidation：对非 JSON-RPC 响应进行结构校验（JSON-RPC 响应跳过）

**基础设施**

- Postgres（只读）
  - src/infra/postgres/client.ts：惰性单例连接与 authenticate 健康检查
  - src/infra/postgres/models/\*：最小集模型注册（按需扩展）
  - src/infra/postgres/generated/public/\*：Kanel 生成类型，字段与结构参照
- Redis（限流与 KV）
  - src/infra/redis/client.ts：PING 健康检查（包含 connected_clients）
  - src/infra/redis/rate-limit.ts：统一限流封装（窗口/阈值可配置）
- Mongo（Mongoose）
  - src/infra/mongo/client.ts：连接与健康检查（readyState、ping 延时、连接数）
  - src/infra/mongo/schemas/\*：i18n/log 占位 schema（后续接入）
- 健康检查端点
  - GET /api/backoffice/health：返回 postgres/redis/mongo 的简要状态与延时
  - 说明：当前端点无需令牌；后续将限制仅管理员可访问（TODO）

**环境变量**

- DATABASE_URL：PostgreSQL 连接（只读账号，必填）
- JWT_SECRET：认证签名密钥（必填）
- RATE_LIMIT：限流阈值（默认 60/min）
- REDIS_ENABLED：是否启用 Redis（true/false）
- REDIS_HOST/REDIS_PORT/REDIS_DB/REDIS_PASSWORD：Redis 连接配置
- MONGODB_URI/MONGODB_DB：Mongo 连接配置
- DOCS_ENABLED：是否启用内部文档端点（可选）

**开发与脚本**

- 通用脚本：
  - dev：本地开发（Next）
  - build：生产构建
  - format：代码格式化（eslint + prettier）
- 类型生成脚本：
  - run-kanel：基于数据库生成类型到 src/infra/postgres/generated/public
  - 说明：生成类型用于编译期约束与字段对齐，模型仍由 Sequelize 定义

**维护建议**

- 为各模块补充 schemas 的 summary/description，提升文档可读性
- 在 controller 中进行必要的参数校验与权限判断，保持边界清晰
- 复用逻辑沉淀在 service 层，与路由层解耦
- 逐步扩充 Postgres 的最小集模型（按需），并对输出字段做白名单裁剪（避免敏感信息暴露）
