<template>
  <PageContainer
    title="系统管理"
    description="包含角色管理与权限管理模块，请从左侧菜单选择具体功能。"
    :breadcrumbs="[{ label: '首页', path: '/' }, { label: '系统管理' }]"
  >
    <router-view />
  </PageContainer>
</template>

<script setup lang="ts">
import { PageContainer } from '@/components';
</script>

<style scoped></style>
