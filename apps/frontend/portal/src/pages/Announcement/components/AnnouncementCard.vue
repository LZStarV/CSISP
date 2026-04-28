<template>
  <a-card class="announcement-card" hoverable>
    <a-card-meta :title="announcement.title">
      <template #description>
        <div class="announcement-description">
          <div class="announcement-meta">
            <span>作者：{{ announcement.authorName }}</span>
            <span>发布时间：{{ formatDate(announcement.createdAt) }}</span>
          </div>
          <div class="announcement-excerpt">
            {{ announcement.content.substring(0, 150) }}...
          </div>
        </div>
      </template>
    </a-card-meta>
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

<style scoped>
.announcement-card {
  width: 100%;
}

.announcement-meta {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 8px;
  display: flex;
  gap: 24px;
}

.announcement-excerpt {
  color: #262626;
  line-height: 1.6;
}
</style>
