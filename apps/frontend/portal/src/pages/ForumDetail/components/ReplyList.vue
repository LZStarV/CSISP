<template>
  <a-list class="reply-list" :data-source="replies">
    <template #renderItem="{ item }">
      <a-list-item class="reply-item">
        <a-comment
          :author="item.authorName"
          :datetime="formatDate(item.createdAt)"
        >
          <template #content>
            <p>{{ item.content }}</p>
          </template>
        </a-comment>
      </a-list-item>
    </template>
    <template #footer v-if="!replies || replies.length === 0">
      <a-empty description="暂无回复" />
    </template>
  </a-list>
</template>

<script setup lang="ts">
import type { Reply } from '@csisp/contracts';

defineProps<{
  replies: Reply[];
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.reply-list {
  margin-top: 16px;
}

.reply-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 0;
}

.reply-item:last-child {
  border-bottom: none;
}
</style>
