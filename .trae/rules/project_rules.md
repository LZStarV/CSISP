CSISP 项目规则（Trae）

1. 代码与风格
   - 必须使用 TypeScript，避免 `any`（文档或类型声明中已明确允许的除外）。
   - Vue 组件文件使用 PascalCase 命名；后端路由统一以 `/api` 为前缀并遵循 openRPC 设计。
   - 严格遵循 ESLint + Prettier + EditorConfig；在生产代码中避免直接使用 `console.*`，统一使用后端 logger 能力；
   - 在完成功能开发后，必须运行 `pnpm -F [sub-application-name] format` 格式化代码，避免引入额外的格式化 diff。

2. 限制与约定
   - 不直接访问数据库连接或原生 SQL，统一通过 Sequelize 模型与 Service 层完成数据访问。
   - 不绕过中间件栈（error/cors/logger/rateLimit/jwtAuth/validation/upload）在路由中直接处理跨领域逻辑。
   - 不使用不安全或被禁止的 API（如 `eval`、`Function` 构造器、明文存储密码等）。

如果没有提供明确指令说明要进行修改，请不要擅自开始修改文件，除非我明确说了需要你进行修改。
在修改完成代码以后，需要执行对应的 ts 检查、build 检查、lint 检查等确保修改没引入新的问题。
如果有任何问题，需要及时向用户提问。
如果有修改接口的需求，则需要先前往 infra/idl 中修改对应 IDL 文件并重新 idl:gen 一次，然后再更新对应的服务端代码与前端代码。
写数据库操作时，必须通过 Sequelize 模型与 Service 层完成，不直接访问数据库连接或原生 SQL。
避免在为参数命名时只使用单字母，而是尽量使用变量全称或简称，以提高代码的可读性和可维护性。
