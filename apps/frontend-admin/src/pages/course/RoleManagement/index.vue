<template>
  <PageContainer
    title="角色管理"
    description="该页面尚未开发完成：后端接口与页面功能正在接入中。当前支持浏览占位信息，后续将提供角色列表、创建/编辑、角色-权限绑定等能力。"
    :breadcrumbs="[
      { label: '首页', path: '/' },
      { label: '系统管理', path: '/system' },
      { label: '角色管理' },
    ]"
  >
    <n-alert type="info" title="开发中" class="mb-4">
      正在接入角色相关接口与UI，预计包括：角色列表分页、创建/编辑角色、删除角色、为角色绑定权限、角色搜索与筛选。
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
