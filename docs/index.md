---
layout: home

hero:
  name: 'CSISP 项目文档中心'
  tagline: 包含架构设计、数据库设计、API文档等完整文档体系
  actions:
    - theme: brand
      text: 什么是 CSISP？
      link: /src/business/业务文档
    - theme: alt
      text: 快速开始
      link: /src/architecture/技术架构设计文档
    - theme: alt
      text: GitHub 仓库
      link: https://github.com/LZStarV/CSISP

features:
  - title: 业务文档
    details: 详细介绍项目的业务需求、流程和功能规划
    link: /src/business/业务文档
  - title: 架构设计
    details: 包含总体架构和技术架构的详细设计方案
    link: /src/architecture/总体架构设计文档
  - title: 后端设计
    details: backend-integrated 后端系统的详细设计（模块、接口、模型等）
    link: /src/backend/backend-integrated%20后端设计文档
  - title: PostgreSQL 数据库
    details: PostgreSQL 表结构、核心实体与 backend-integrated 的关系说明
    link: /src/database/PostgreSQL%20数据库说明文档
  - title: Redis 数据库
    details: Redis 键规范、TTL 与缓存策略说明（考勤/作业/仪表盘）
    link: /src/database/Redis%20数据库说明文档
  - title: 技术架构
    details: 项目使用的技术栈和架构模式说明
    link: /src/architecture/技术架构设计文档
  - title: BFF 架构详细设计
    details: BFF 层的路由分区、聚合编排、鉴权与限流方案
    link: /src/bff/BFF架构详细设计文档
  - title: 前端中台设计
    details: 前端中台架构与模块设计、路由与状态管理规范
    link: /src/frontend/前端中台设计文档
---

## 项目简介

CSISP(Computer Science Integrated Service Platform)是由 LZStarV 个人开发与维护的 SCNU 计算机学院综合服务平台仿真项目。本文档中心提供了完整的项目文档，包括业务需求、架构设计、技术实现等各个方面的内容。

## 快速开始

1. 阅读[业务文档](/src/business/业务文档)了解项目需求
2. 查看[总体架构设计文档](/src/architecture/总体架构设计文档)掌握系统架构
3. 查阅[PostgreSQL 数据库说明文档](/src/database/PostgreSQL%20数据库说明文档)了解核心表结构
4. 查阅[backend-integrated 后端设计文档](/src/backend/backend-integrated%20后端设计文档)对照接口与实现进行开发
