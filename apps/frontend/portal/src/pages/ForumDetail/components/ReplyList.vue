<template>
  <n-list class="reply-list">
    <template #default>
      <n-list-item
        v-for="(item, index) in replies"
        :key="index"
        class="reply-item"
      >
        <div class="comment-wrapper">
          <div class="comment-header">
            <span class="comment-author">{{ item.authorName }}</span>
            <span class="comment-time">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="comment-content">{{ item.content }}</div>
        </div>
      </n-list-item>
    </template>
    <template #footer v-if="!replies || replies.length === 0">
      <n-empty :description="t('forum.reply.empty', '暂无回复')" />
    </template>
  </n-list>
</template>

<script setup lang="ts">
import type { Reply } from '@csisp/contracts';
import { useI18n } from 'vue-i18n';

defineProps<{
  replies: Reply[];
}>();

const { t } = useI18n();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.reply-list {
  margin-top: 16px;
}

.reply-item {
  padding: 12px 0;
}

.comment-wrapper {
  width: 100%;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
}

.comment-time {
  color: #999;
  font-size: 12px;
}

.comment-content {
  line-height: 1.6;
}
</style>
