import { defineConfig } from 'vitepress';

const unifiedSidebar = [
  {
    text: '入门指南',
    items: [
      {
        text: '项目简介',
        link: '/src/入门指南/项目简介',
      },
      {
        text: '环境搭建',
        link: '/src/入门指南/环境搭建',
      },
      {
        text: '快速开始',
        link: '/src/入门指南/快速开始',
      },
      {
        text: '目录结构',
        link: '/src/入门指南/目录结构',
      },
    ],
  },
  {
    text: '架构设计',
    items: [
      { text: '总体架构', link: '/src/架构设计/总体架构' },
      { text: '技术栈选型', link: '/src/架构设计/技术栈选型' },
      { text: '核心模块设计', link: '/src/架构设计/核心模块设计' },
      { text: '数据流与交互', link: '/src/架构设计/数据流与交互' },
      { text: '安全架构', link: '/src/架构设计/安全架构' },
    ],
  },
  {
    text: '开发指南',
    items: [
      {
        text: '代码与风格约定',
        link: '/src/开发指南/代码与风格约定',
      },
      { text: '测试与验证', link: '/src/开发指南/测试与验证' },
      {
        text: 'CI 与文档构建部署',
        link: '/src/开发指南/CI与文档构建部署',
      },
    ],
  },
  {
    text: '基础设施与基建',
    items: [
      {
        text: '数据库（PostgreSQL）',
        link: '/src/基础设施与基建/数据库（PostgreSQL）',
      },
      {
        text: 'Redis 缓存与限流',
        link: '/src/基础设施与基建/Redis 缓存与限流',
      },
      { text: 'Mongo', link: '/src/基础设施与基建/Mongo' },
      {
        text: 'IDL（Thrift）',
        link: '/src/基础设施与基建/IDL（Thrift）',
      },
    ],
  },
];

export default defineConfig({
  title: 'CSISP 项目文档中心',
  base: '/CSISP/',
  vite: {
    server: {
      port: 8173,
    },
  },
  description: 'CSISP项目的技术文档集合，包含架构设计、数据库设计、API文档等',
  themeConfig: {
    nav: [
      {
        text: '入门指南',
        link: '/src/入门指南/项目简介',
      },
      {
        text: '架构设计',
        link: '/src/架构设计/总体架构',
      },
      {
        text: '开发指南',
        link: '/src/开发指南/代码与风格约定',
      },
      {
        text: '基础设施与基建',
        link: '/src/基础设施与基建/数据库（PostgreSQL）',
      },
      {
        text: '模块详解',
        link: '/src/模块详解/backend-integrated/架构与目录',
      },
    ],
    sidebar: {
      '/src/入门指南/': unifiedSidebar,
      '/src/架构设计/': unifiedSidebar,
      '/src/开发指南/': unifiedSidebar,
      '/src/基础设施与基建/': unifiedSidebar,
      '/src/模块详解/': [
        {
          text: 'backend-integrated',
          items: [
            {
              text: '架构与目录',
              link: '/src/模块详解/backend-integrated/架构与目录',
            },
            {
              text: 'OpenRPC 契约与约定',
              link: '/src/模块详解/backend-integrated/OpenRPC 契约与约定',
            },
            {
              text: '数据访问与缓存',
              link: '/src/模块详解/backend-integrated/数据访问与缓存',
            },
            {
              text: '中间件与治理',
              link: '/src/模块详解/backend-integrated/中间件与治理',
            },
            {
              text: '本地开发与脚本',
              link: '/src/模块详解/backend-integrated/本地开发与脚本',
            },
          ],
        },
        {
          text: 'bff',
          items: [
            {
              text: '架构与目录',
              link: '/src/模块详解/bff/架构与目录',
            },
            {
              text: 'OpenRPC 聚合与错误规范',
              link: '/src/模块详解/bff/OpenRPC 聚合与错误规范',
            },
            {
              text: '中间件与限流',
              link: '/src/模块详解/bff/中间件与限流',
            },
            {
              text: '本地开发与脚本',
              link: '/src/模块详解/bff/本地开发与脚本',
            },
          ],
        },
        {
          text: 'backoffice',
          items: [
            {
              text: '架构与目录',
              link: '/src/模块详解/backoffice/架构与目录',
            },
            {
              text: 'JSON-RPC路由与响应规范',
              link: '/src/模块详解/backoffice/JSON-RPC路由与响应规范',
            },
            {
              text: '中间件与安全',
              link: '/src/模块详解/backoffice/中间件与安全',
            },
            {
              text: '基础设施封装',
              link: '/src/模块详解/backoffice/基础设施封装',
            },
            {
              text: 'UI 与样式约定',
              link: '/src/模块详解/backoffice/UI 与样式约定',
            },
            {
              text: '本地开发与脚本',
              link: '/src/模块详解/backoffice/本地开发与脚本',
            },
            {
              text: '限定状态码映射与健康端点权限',
              link: '/src/模块详解/backoffice/限定状态码映射与健康端点权限',
            },
          ],
        },
        {
          text: 'frontend-admin',
          items: [
            {
              text: '架构与目录',
              link: '/src/模块详解/frontend-admin/架构与目录',
            },
            {
              text: '页面与路由',
              link: '/src/模块详解/frontend-admin/页面与路由',
            },
            {
              text: '状态与接口协作',
              link: '/src/模块详解/frontend-admin/状态与接口协作',
            },
          ],
        },
        {
          text: 'frontend-portal',
          items: [
            {
              text: '架构与目录',
              link: '/src/模块详解/frontend-portal/架构与目录',
            },
            {
              text: '页面与路由',
              link: '/src/模块详解/frontend-portal/页面与路由',
            },
            {
              text: '接口协作与最佳实践',
              link: '/src/模块详解/frontend-portal/接口协作与最佳实践',
            },
          ],
        },
      ],
    },
  },
});
