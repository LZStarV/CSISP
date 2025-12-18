---
layout: home

hero:
  name: 'CSISP 项目文档中心'
  tagline: 包含架构设计、数据库设计、API文档等完整文档体系
  actions:
    - theme: brand
      text: 查看业务文档
      link: /src/business/业务文档
    - theme: alt
      text: 查看架构设计
      link: /src/architecture/总体架构设计文档
    - theme: alt
      text: BFF 架构
      link: /src/bff/BFF架构详细设计文档
    - theme: alt
      text: 后端开发
      link: /src/backend/后端设计文档
    - theme: alt
      text: 数据设计
      link: /src/database/数据库设计文档
    - theme: alt
      text: 前端开发
      link: /src/frontend/前端中台设计文档

features:
  - title: 业务文档
    details: 详细介绍项目的业务需求、流程和功能规划
    link: /src/business/业务文档
  - title: 架构设计
    details: 包含总体架构和技术架构的详细设计方案
    link: /src/architecture/总体架构设计文档
  - title: 后端设计
    details: 后端系统的详细设计，包括API、数据模型等
    link: /src/backend/后端设计文档
  - title: 数据库设计
    details: 数据库表结构、关系和索引设计（含子课程、时间段、课程-教师、作业附件）
    link: /src/database/数据库设计文档
  - title: 数据模型类型
    details: TypeScript数据模型类型说明和使用规范（对齐 Course/TimeSlot/Attendance 等字段）
    link: /src/database/数据模型类型说明文档
  - title: 技术架构
    details: 项目使用的技术栈和架构模式说明
    link: /src/architecture/技术架构设计文档
  - title: BFF 架构详细设计
    details: BFF 层的路由分区、聚合编排、鉴权与限流方案
    link: /src/bff/BFF架构详细设计文档
  - title: 后端项目初始化指南
    details: 详细讲解后端项目初始化脚本的运作机制和使用方法
    link: /src/backend/后端项目初始化指南
  - title: 中间件设计
    details: Koa 中间件体系与配置（错误处理、鉴权、限流、上传等）
    link: /src/backend/中间件设计文档
  - title: 数据库目录创建方案
    details: 统一数据库目录结构与维护策略
    link: /src/database/数据库目录创建方案
  - title: 数据库基础设施与迁移使用指南
    details: 使用 infra/database 与 db-schema 的统一启动、迁移与种子流程
    link: /src/database/数据库基础设施与迁移使用指南
  - title: 类型兼容性验证报告
    details: 关键模型类型与后端字段的对齐验证情况
    link: /src/database/类型兼容性验证报告
  - title: 前端中台设计
    details: 前端中台架构与模块设计、路由与状态管理规范
    link: /src/frontend/前端中台设计文档
---

## 项目简介

CSISP是一个复杂的信息系统项目，本文档中心提供了完整的项目文档，包括业务需求、架构设计、技术实现等各个方面。

通过左侧导航栏可以浏览所有文档，顶部导航提供了常用文档的快速访问。

## 快速开始

1. 阅读[业务文档](/src/business/业务文档)了解项目需求
2. 查看[总体架构设计文档](/src/architecture/总体架构设计文档)掌握系统架构
3. 参考[后端项目初始化指南](/src/backend/后端项目初始化指南)进行环境搭建
4. 查阅[数据模型类型说明文档](/src/database/数据模型类型说明文档)进行开发
