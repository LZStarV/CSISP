# CSISP BFF 项目说明

**项目概览**

- 该项目是前端网关（Backend For Frontend, BFF），为多个子项目提供统一的接口聚合、协议收敛与跨域治理。
- 采用模块化与 JSON-RPC 风格：统一 POST 请求、明确的错误编码与可生成的契约文档。
- 子项目（subProject）目前包含 admin 与 portal，两者路由层互不绑定，可独立或并存。

**目录结构**

- src/modules：按子项目聚合，并在子项目内再按 domain-action 划分
  - modules/admin/demo：示例模块（三件套：controller、service、module）
  - modules/portal/demo：示例模块（三件套：controller、service、module）
  - modules/admin/index.ts：管理端模块聚合导出
  - modules/portal/index.ts：门户端模块聚合导出
  - modules/index.ts：汇总导出所有子项目模块（用于批量注册）
- src/rpc：JSON-RPC 相关实现
  - dispatcher.ts：分发入口（解析 subProject/domain/action，返回 JSON-RPC 响应）
  - registry.ts：注册器（REGISTRY[subProject][domain.action]）
  - errors.ts/types.ts：错误编码与模型
  - openrpc.ts：根据模块的 schemas 生成 OpenRPC 文档（双端点）
- src/router：路由入口
  - index.ts：统一前缀 /api/bff 的路由与 OpenRPC 文档端点
- src/middleware：通用中间件
  - error/cors/logger/trace/jwtAuth/rateLimit/legacyProxy/responseValidation/roles
- src/infra：底层依赖与工具（logger、redis、HTTP client）

**RPC 规范**

- 路由格式：POST /api/bff/:subProject/:domain/:action
  - 示例：/api/bff/portal/demo/test 或 /api/bff/admin/demo/test
- 请求
  - 统一使用 POST，参数放在 body 中
  - body 可包含可选 id 字段（若缺省，服务端自动生成）
  - 不需要 body.method，方法名由 URL 中的 :domain/:action 决定
- 响应（JSON-RPC 2.0）
  - 成功：{ jsonrpc: '2.0', id, result }
  - 失败：{ jsonrpc: '2.0', id, error: { code, message, data? } }
  - 错误编码由 rpc/errors.ts 定义与映射（例如 MethodNotFound、InvalidParams、InternalError）
- 文档端点（OpenRPC）
  - GET /api/bff/portal/openrpc.json（仅包含 portal 子项目方法）
  - GET /api/bff/admin/openrpc.json（仅包含 admin 子项目方法）
  - 文档包含 methods 的 summary/description 以及 params/result 的简化结构（由各模块的 schemas 提供）

**模块开发规范**

- 每个 domain-action 以“三件套”组织：
  - controller.ts：方法入口，进行 zod 的 params/result 校验并返回结果
  - service.ts：承载具体业务逻辑（可调用上游或做聚合）
  - module.ts：导出该子项目的模块对象（subProject、handlers、schemas）
- 子项目聚合导出：
  - 子项目下的 index.ts 统一导出该子项目所有模块（数组）
  - 顶层 modules/index.ts 汇总所有子项目模块，用于批量注册到注册表
- 注册与分发：
  - 应用启动时，路由入口遍历模块列表，按子项目批量注册 REGISTRY[subProject][domain.action]
  - dispatcher 解析 URL → 校验启用的子项目集合 → 执行 handler → JSON-RPC 响应

**中间件与治理**

- error：统一错误包装为 HTTP JSON（对非 JSON-RPC 响应的兜底）
- logger：记录 context（rpc/http）、method/path/status/duration/traceId 等
- trace：生成或透传 X-Trace-Id，写入 ctx.state 并回写到响应头
- jwtAuth/roles：鉴权与角色控制（方法级可在 controller 内执行业务校验）
- rateLimit：滑窗限流（默认按 ip+path）
- responseValidation：对非 JSON-RPC 响应进行结构校验（JSON-RPC 响应会跳过）
- legacyProxy：对未命中的 /api/bff 路径进行兜底转发（保留查询参数与关键请求头）

**环境变量**

- BFF_ENABLED_SUBPROJECTS：启用的子项目集合，逗号分隔（默认 portal,admin）
- JWT_SECRET：JWT 鉴权密钥（如启用 jwtAuth）
- CSISP_BFF_PORT：服务监听端口
- CSISP_BFF_URL：前端访问 BFF 的基础 URL（用于前端代理与 OIDC 回调拼接）
- CSISP_BACKEND_INTEGRATED_URL：legacyProxy 转发目标的基础地址
- REDIS_HOST / REDIS_PORT / REDIS_DB / REDIS_PASSWORD / REDIS_NAMESPACE：Redis 连接配置

**开发须知**

- 类型与校验：
  - 所有方法的入参与出参建议使用 zod schema，就地定义在对应 module 或 controller 中
  - OpenRPC 文档自动从各模块的 schemas 聚合生成
- 目录约定：
  - 子项目不限于单一 domain，可按业务需要增设多个 domain-action，目录需保持清晰与可维护
  - 复用逻辑通过 service 层抽象，与路由层无关
- 错误处理：
  - controller 内抛出的错误由 dispatcher 捕获并映射为 JSON-RPC 错误
  - 框架层异常或非 RPC 路径由 error 中间件兜底处理

**运行与脚本**

- 通用脚本：
  - dev：本地开发（nodemon + tsx）
  - build：产物打包（esbuild）
  - start：运行打包后的产物
  - format：代码格式化（eslint + prettier）
  - lint：代码静态检查
- 子项目开关脚本：
  - dev:portal：仅启用 portal 子项目并进入开发模式
  - dev:admin：仅启用 admin 子项目并进入开发模式
  - start:portal：仅启用 portal 子项目运行打包产物
  - start:admin：仅启用 admin 子项目运行打包产物
- 说明：
  - 子项目开关通过设置 BFF_ENABLED_SUBPROJECTS 实现（脚本已内置设置）
  - 默认 dev/start 不限制子项目，portal 与 admin 全部启用

**健康检查**

- 端口：由环境变量 CSISP_BFF_PORT 控制
- 健康接口：GET /api/bff/health
  - 返回：{ code: 0, message: 'OK' }
  - 用法示例：
    - 浏览器打开 ${CSISP_BFF_URL}/api/bff/health
    - 或使用 curl：curl -s ${CSISP_BFF_URL}/api/bff/health

**接口示例（演示方法）**

- POST /api/bff/portal/demo/test
  - 请求体：{} 或包含任意辅助字段（不需要 method）
  - 响应：{ jsonrpc: '2.0', id, result: { ok: true, project: 'portal' } }
- POST /api/bff/admin/demo/test
  - 请求体：{}
  - 响应：{ jsonrpc: '2.0', id, result: { ok: true, project: 'admin' } }
- 文档：
  - GET /api/bff/portal/openrpc.json
  - GET /api/bff/admin/openrpc.json

**接口文档调试**

- 打开文档：
  - 在浏览器访问对应子项目的 openrpc.json，即可查看方法列表与参数/返回的结构描述
  - portal 文档示例：${CSISP_BFF_URL}/api/bff/portal/openrpc.json
- 当前文档端点与健康接口无需令牌；后续将限制文档端点仅超级管理员可访问
  - admin 文档示例：${CSISP_BFF_URL}/api/bff/admin/openrpc.json
- 使用工具调试：
  - 可将 openrpc.json 导入支持 OpenRPC 的调试/生成工具，或手动使用 curl/Postman 进行请求
  - JSON-RPC 请求示例（portal 演示方法）：
    - curl -X POST -H "Content-Type: application/json" -d '{}' ${CSISP_BFF_URL}/api/bff/portal/demo/test
    - curl -X POST -H "Content-Type: application/json" -d '{}' ${CSISP_BFF_URL}/api/bff/admin/demo/test

**维护建议**

- 为每个新增方法补充 schemas 的 summary/description，提升 OpenRPC 文档可读性
- 在 controller 中进行必要的参数校验与权限判断，保持边界清晰
- 复用逻辑沉淀在 service 层，避免在 controller 内堆积业务细节
- 若未来需要自动发现模块，可通过预构建脚本生成模块索引；当前使用静态索引更稳定简单
