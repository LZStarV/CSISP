<template>
  <PageContainer
    title="权限管理"
    description="该页面尚未开发完成：权限模型与接口正在完善中。当前展示占位信息，后续将支持权限列表、创建/编辑、删除、权限分组与搜索筛选等功能。"
    :breadcrumbs="[
      { label: '首页', path: '/' },
      { label: '系统管理', path: '/system' },
      { label: '权限管理' },
    ]"
  >
    <n-alert type="info" title="开发中" class="mb-4">
      正在接入权限相关接口与UI，预计包括：权限列表分页、创建/编辑/删除、按模块分组、与角色绑定管理。
    </n-alert>
    <n-card>
      <n-empty description="功能开发中，敬请期待" />
    </n-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { NAlert, NCard, NEmpty } from 'naive-ui';
import { PageContainer } from '@/components';
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
