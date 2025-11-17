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
      { text: '技术文档', link: '/src/architecture/技术架构设计文档' },
    ],

    sidebar: [
      {
        text: '项目概览',
        items: [
          { text: '首页', link: '/' },
          { text: '业务文档', link: '/src/business/业务文档' },
        ],
      },
      {
        text: '架构设计',
        items: [
          { text: '总体架构设计文档', link: '/src/architecture/总体架构设计文档' },
          { text: '技术架构设计文档', link: '/src/architecture/技术架构设计文档' },
        ],
      },
      {
        text: '后端开发',
        items: [{ text: '后端设计文档', link: '/src/backend/后端设计文档' }],
      },
      {
        text: '数据设计',
        items: [
          { text: '数据库设计文档', link: '/src/database/数据库设计文档' },
          { text: '数据模型类型说明文档', link: '/src/database/数据模型类型说明文档' },
        ],
      },
    ],
  },
});
