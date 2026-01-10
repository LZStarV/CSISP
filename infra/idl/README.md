# CSISP Thrift IDL v1

## 目的

- 作为内部微服务的统一契约与类型来源（Thrift IDL）。
- 以 v1 为当前版本目录，后续如有破坏性更新将新增 v2 并保留 v1 并行。

## 目录结构

- 源文件（v1）：包含 common.thrift、user.thrift 等领域 IDL 文件。
- 生成物工作区包：@csisp/idl-artifacts（TypeScript 类型与入口），下设 ts/v1/common 与 ts/v1/user 等领域目录。

## 使用与命令

- 安装依赖（首次或更新后）：
  - pnpm install
- 编译生成物包（TypeScript 构建与类型声明产出）：
  - pnpm -F @csisp/idl-artifacts build
- 在 sandbox 中进行编译验证（CommonJS）：
  - pnpm -F @csisp/rpc-sandbox build
- 示例引用（编译检查）：

```ts
import { common, user } from '@csisp/idl-artifacts';

const u: user.User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  status: common.Status.Active,
  createdAt: Date.now(),
};
```

## 扩展与演进

- 新增领域：在 v1 下增加对应 .thrift 文件（如 course.thrift、homework.thrift 等）。
- 兼容性约定：
  - 新增字段使用 optional，避免破坏已发布结构。
  - 不重排已存在字段的 ID；如需删除/重命名，采用新增版本目录（例如 v2）。
- 当前状态：
  - 暂未接入自动生成器，@csisp/idl-artifacts 的 TS 类型源为 IDL 等价映射的手写版本，用于“编译级验证”。
  - 待生成器接入后，将用自动化脚本从 v1 同步生成 TS 类型与客户端/服务端桩代码，并替换手写源。

## 生成器与工具（后续接入）

- Thrift 编译器安装（macOS）：
  - brew install thrift
- 计划的 TypeScript 生成脚本（示例占位，生成器接入后生效）：
  - pnpm idl:gen:ts
  - pnpm -F @csisp/idl-artifacts build
- 传输与协议（服务实现阶段采用）：
  - Transport：TFramedTransport（分帧传输，识别消息边界，跨语言更稳）。
  - Protocol：TCompactProtocol（紧凑二进制编码，性能与体积优）。
