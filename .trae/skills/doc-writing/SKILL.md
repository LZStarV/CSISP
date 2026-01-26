---
name: 'doc-writing'
description: '撰写与维护文档项目（docs/）的统一 SOP 与 VitePress 写法。需要编写/重构文档或规范时调用。'
---

# 文档撰写 Skill（CSISP）

## 适用场景

- 撰写/重构 docs/src 下的页面内容、统一语气与结构
- 新增或调整站点导航/侧边栏顺序（不依赖文件编号）
- 引入 VitePress Markdown 扩展（容器、目录表、内部链接、锚点等）

## 执行SOP

- Draft 阶段
  - 为目标板块生成 draft：明确 H2/H3 大纲、讲解要点、展示方式（代码分组/必要图示）
  - 进行问答迭代，获批后再进入正文撰写
  - 章节权重与占比可不均衡：不同章节内容深浅不一，按真实重要性与当前实现成熟度安排分点数量与细节
- 正文撰写
  - 统一 Frontmatter：title、description、editLink: true、outline: deep
  - 介绍性语气：先概述后细化，分点精炼，避免 file:// 链接
  - 链接使用站内相对路径（如 /src/入门指南/项目简介），不写扩展名或使用 .md/.html 皆可
  - TODO 机制：当用户指示“写到 TODO”，将事项记录到对应板块的 TODO.md（如 /src/入门指南/TODO、/src/模块详解/<项目>/TODO 等）
  - 疑问机制：生成完文档后，如在书写过程中产生任何疑问，需及时询问你以对齐细节
- 完成与清理
  - 页面无断链、导航与侧边栏一致、搜索关键词可命中
  - 本板块完成后删除相应 draft，进入下一个模块
  - 执行一次文档构建校验，确保无编译错误：`pnpm --filter @csisp/docs build`（或在 `docs/` 目录执行 `pnpm build`）

## 顺序控制（不依赖编号）

- 顶部导航顺序：在 docs/.vitepress/config.ts 的 themeConfig.nav 数组按期望顺序排列
- 侧边栏顺序：在 themeConfig.sidebar 中对应分组的 items 数组声明顺序（或 unifiedSidebar）
- prev/next 导航：跟随当前侧边栏 items 的声明顺序自动生成

## VitePress Markdown 要点

- 内部链接
  - [首页](/) 与目录 index.md 会映射到对应 index.html
  - [同级标题锚](/foo/#heading)、[相对路径](../bar/three) 可省略扩展名
- 标题锚点
  - 自定义锚：在标题后追加 {#my-anchor}，可链接为 #my-anchor
- 自定义容器
  - ::: info / tip / warning / danger / details
  - 通过 config.ts 的 markdown.container 可全局设置容器标题（如“提示/警告/危险/信息/详细信息”）
- GitHub 风格警报
  - > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
- 原始容器（样式/路由隔离）
  - ::: raw 包裹内容或使用 vp-raw 类；可结合 postcssIsolateStyles
- 代码组
  - 用于并列展示多段代码或指令；在文档中采用 Code Groups 提升可读性
- Frontmatter
  - 标准 YAML frontmatter 开箱即用，值可供页面与主题组件使用

## 写作规范

- 语气：介绍性、面向开发者与 Vibe Coding，避免口语化
- 结构：先总览后细化；复杂主题在“目录结构/模块详解”展开
- 图示：仅在必要处使用简化 Mermaid 图，避免过度
- 关键词：为站内搜索准备可命中词（如 模块详解/子项目/基建/OpenRPC 等）
- 行内代码：在必要位置使用反引号包裹术语/命令/键名，例如：
  - 包脚本与命令：`dev:infra`、`pnpm i`、`docker compose`
  - 文件与环境变量：`.env`、`DATABASE_URL`
  - 接口与路由：`POST /api/backoffice/:domain/:action`
  - 选项与标志：`--filter`、`--activate`
  - 站内路径与接口路径：如 `/src/架构设计/总体架构`、`/api/bff/portal/user/getUser`
  - 不过度使用，仅在可读性与语义清晰度提升时添加
- 列举与路径规则：
  - 非路径的列表项使用空格分隔，避免误读为路径，例如：apps / packages / infra / docs
  - 站内路径作为超链接时，不使用反引号，采用 `[文本](/站内/路径)` 写法
- 关联说明：不单独维护“关联板块”链接列表；如需关联，请在正文自然说明并适当加入站内链接
- 表格写法：
  - 允许在表格单元格使用 `<br />` 进行换行以提升可读性
  - 表格中的一些技术名词、路径、命令等，与上面反引号规则一致，需要进行包裹，例如：`POST /api/backoffice/:domain/:action`

## 校验清单

- Frontmatter 完整、标题层级统一
- 链接有效（内部链接使用 /src/...），无 file://
- 导航与侧边栏与 config.ts 一致，prev/next 正常
- 搜索命中关键主题，无 404
- 文档构建通过（`pnpm --filter @csisp/docs build` 或在 `docs/` 目录执行 `pnpm build`）

## 参考

- VitePress Markdown 扩展：https://vitepress.dev/zh/guide/markdown
- 站点配置入口：docs/.vitepress/config.ts
