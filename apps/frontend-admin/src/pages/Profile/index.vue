<template>
  <PageContainer
    title="个人中心"
    description="该页面尚未开发完成：个人信息展示与编辑、头像与偏好设置等功能正在接入中。"
    :breadcrumbs="[{ label: '首页', path: '/' }, { label: '个人中心' }]"
  >
    <n-alert type="info" title="开发中" class="mb-4">
      计划提供：个人资料查看与编辑、头像上传、主题偏好、账号安全设置等。
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
