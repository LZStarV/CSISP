# @csisp/i18n

CSISP 项目多语言翻译管理包，基于 SimpleLocalize 平台进行翻译文本的维护与分发。

## 目录结构

```
packages/i18n/
├── scripts/
│   └── pull-translations.ts    # 从 SimpleLocalize 拉取翻译的脚本
├── src/
│   └── locales/                # 翻译源文件（按项目/语言组织）
│       ├── common/              # 通用文案
│       │   ├── en/common.json
│       │   └── zh/common.json
│       ├── idp-client/          # IDP 客户端文案
│       │   ├── en/common.json
│       │   └── zh/common.json
│       └── portal/              # Portal 文案（如有）
├── common.json                  # SimpleLocalize 导出格式 - 通用文案
├── idp-server.json              # SimpleLocalize 导出格式 - IDP 相关文案
└── package.json
```

## 文件说明

| 文件              | 用途                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `src/locales/`    | 按语言+项目组织的翻译源文件，供前端运行时使用                       |
| `common.json`     | SimpleLocalize multi-language-json 格式，用于导入/导出通用文案      |
| `idp-server.json` | SimpleLocalize multi-language-json 格式，用于导入/导出 IDP 相关文案 |

## 翻译格式

本包采用 SimpleLocalize 的 [multi-language-json](https://simplelocalize.io/docs/file-formats/multi-language-json/) 格式：

```json
{
  "en": {
    "login.title": "Login",
    "login.email.label": "Email"
  },
  "zh": {
    "login.title": "登录",
    "login.email.label": "邮箱"
  }
}
```

支持 Message Interpolation 插值变量：

```json
{
  "en": {
    "login.email.length": "Email length is {minLength}-{maxLength} characters"
  },
  "zh": {
    "login.email.length": "邮箱长度为{minLength}-{maxLength}个字符"
  }
}
```

## 常见指令

### 拉取翻译

从 SimpleLocalize 拉取最新翻译到本地 `src/locales` 目录：

```bash
# 拉取通用文案
pnpm -F @csisp/i18n pull:common

# 拉取 IDP 客户端文案
pnpm -F @csisp/i18n pull:idp-client

# 拉取 Portal 文案
pnpm -F @csisp/i18n pull:portal

# 拉取全部
pnpm -F @csisp/i18n pull:all
```

拉取脚本会调用 SimpleLocalize API，以 `multi-language-json` 格式下载翻译，并按语言拆分为独立的 JSON 文件。

### 构建

```bash
pnpm -F @csisp/i18n build
```

<br />

## 前端使用方式

### 按项目导出

```typescript
// 通用文案
import { commonLocales } from '@csisp/i18n/common';

// IDP 客户端文案
import { idpClientLocales } from '@csisp/i18n/idp-client';
```

### 使用示例

```typescript
import { commonLocales } from '@csisp/i18n/common';

const currentLocale = 'zh';
const t = commonLocales[currentLocale].common;

console.log(t.login); // 输出: 登录
console.log(t.email); // 输出: 邮箱
```

## 与 SimpleLocalize 的协作流程

1. **翻译管理**：在 SimpleLocalize Web 界面管理翻译文本
2. **拉取更新**：使用 `pull:*` 命令将翻译拉取到 `src/locales` 目录
3. **前端使用**：前端应用从 `@csisp/i18n` 导入对应模块的翻译

## 注意事项

- `common.json` 和 `idp-server.json` 为 SimpleLocalize 格式的快照，用于导入/导出
- 前端运行时使用 `src/locales` 目录下按语言组织的 JSON 文件
- 修改翻译后，建议同步更新 SimpleLocalize 和本地文件
