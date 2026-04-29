<template>
  <a-card class="announcement-content">
    <template #title>
      <h2>{{ announcement.title }}</h2>
    </template>
    <div class="announcement-meta">
      <span>作者：{{ announcement.authorName }}</span>
      <span>发布时间：{{ formatDate(announcement.createdAt) }}</span>
    </div>
    <div class="announcement-body">{{ announcement.content }}</div>
  </a-card>
</template>

<script setup lang="ts">
import type { Announcement } from '@csisp/contracts';

defineProps<{
  announcement: Announcement;
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style lang="scss" scoped>
.announcement-meta {
  color: #8c8c8c;
  font-size: 14px;
  margin-bottom: 24px;
  display: flex;
  gap: 24px;
}

.announcement-body {
  line-height: 1.8;
  font-size: 16px;
}
</style>
