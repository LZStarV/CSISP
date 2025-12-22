import { defineConfig } from 'vitepress';

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
      { text: '首页', link: '/' },
      { text: '系统架构与分层设计', link: '/src/architecture/总体架构设计文档' },
      { text: '实现细节与技术选型', link: '/src/architecture/技术架构设计文档' },
    ],

    // 全局侧边栏：按模块罗列所有文档，任何页面都能看到完整索引
    sidebar: [
      {
        text: '架构设计',
        items: [
          { text: '总体架构设计文档', link: '/src/architecture/总体架构设计文档' },
          { text: '技术架构设计文档', link: '/src/architecture/技术架构设计文档' },
        ],
      },
      {
        text: 'backend-integrated 后端',
        items: [
          {
            text: 'backend-integrated 后端设计文档',
            link: '/src/backend/backend-integrated%20后端设计文档',
          },
        ],
      },
      {
        text: '数据库说明',
        items: [
          {
            text: 'PostgreSQL 数据库说明文档',
            link: '/src/database/PostgreSQL%20数据库说明文档',
          },
          {
            text: 'Redis 数据库说明文档',
            link: '/src/database/Redis%20数据库说明文档',
          },
        ],
      },
      {
        text: 'BFF 架构',
        items: [
          {
            text: 'BFF 架构详细设计文档',
            link: '/src/bff/BFF架构详细设计文档',
          },
        ],
      },
      {
        text: '前端中台',
        items: [
          {
            text: '前端中台设计文档',
            link: '/src/frontend/前端中台设计文档',
          },
        ],
      },
      {
        text: '业务文档',
        items: [{ text: '业务说明文档', link: '/src/business/业务文档' }],
      },
    ],
  },
});
