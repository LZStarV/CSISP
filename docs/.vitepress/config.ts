import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CSISP 项目文档中心',
  vite: {
    server: {
      port: 8173,
    },
  },
  description: 'CSISP项目的技术文档集合，包含架构设计、数据库设计、API文档等',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '架构设计', link: '/src/architecture/总体架构设计文档' },
      { text: '后端开发', link: '/src/backend/后端设计文档' },
      { text: '数据设计', link: '/src/database/数据库设计文档' },
      { text: '前端开发', link: '/src/frontend/前端中台设计文档' },
      { text: '业务文档', link: '/src/business/业务文档' },
    ],

    sidebar: {
      '/src/architecture/': [
        {
          text: '架构设计',
          items: [
            { text: '总体架构', link: '/src/architecture/总体架构设计文档' },
            { text: '技术架构', link: '/src/architecture/技术架构设计文档' },
          ],
        },
      ],
      '/src/backend/': [
        {
          text: '后端开发',
          items: [
            { text: '后端设计', link: '/src/backend/后端设计文档' },
            { text: '项目初始化', link: '/src/backend/后端项目初始化指南' },
            { text: '中间件设计', link: '/src/backend/中间件设计文档' },
          ],
        },
      ],
      '/src/database/': [
        {
          text: '数据设计',
          items: [
            { text: '数据库设计', link: '/src/database/数据库设计文档' },
            { text: '数据库目录创建方案', link: '/src/database/数据库目录创建方案' },
            { text: '数据模型类型', link: '/src/database/数据模型类型说明文档' },
            { text: '类型兼容性验证报告', link: '/src/database/类型兼容性验证报告' },
          ],
        },
      ],
      '/src/business/': [
        {
          text: '业务文档',
          items: [{ text: '业务说明', link: '/src/business/业务文档' }],
        },
      ],
      '/src/frontend/': [
        {
          text: '前端开发',
          items: [{ text: '前端中台设计', link: '/src/frontend/前端中台设计文档' }],
        },
      ],
    },
  },
});
