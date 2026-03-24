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
});
