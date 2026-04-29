<template>
  <n-card class="announcement-card" hoverable>
    <template #header>
      <div style="font-weight: 500; font-size: 16px">
        {{ announcement.title }}
      </div>
      <div class="announcement-meta">
        <span
          >{{ t('announcement.author', '作者') }}：{{
            announcement.authorName
          }}</span
        >
        <span
          >{{ t('announcement.publishTime', '发布时间') }}：{{
            formatDate(announcement.createdAt)
          }}</span
        >
      </div>
    </template>
    <div class="announcement-excerpt">
      {{ announcement.content.substring(0, 150) }}...
    </div>
  </n-card>
</template>

<script setup lang="ts">
import type { Announcement } from '@csisp/contracts';
import { useI18n } from 'vue-i18n';

defineProps<{
  announcement: Announcement;
}>();

const { t } = useI18n();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style lang="scss" scoped>
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
