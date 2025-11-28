<template>
  <PageContainer
    title="修改密码"
    description="该页面尚未开发完成：密码修改与安全校验流程正在接入中。"
    :breadcrumbs="[{ label: '首页', path: '/' }, { label: '修改密码' }]"
  >
    <n-alert type="info" title="开发中" class="mb-4">
      计划提供：旧密码校验、强度校验、两步验证提示与重置流程。
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
