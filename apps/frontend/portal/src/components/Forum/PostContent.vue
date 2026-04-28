<template>
  <a-card class="post-content">
    <template #title>
      <h2>{{ post.title }}</h2>
    </template>
    <div class="post-meta">
      <span>作者：{{ post.authorName }}</span>
      <span>发布时间：{{ formatDate(post.createdAt) }}</span>
    </div>
    <div class="post-body">{{ post.content }}</div>
  </a-card>
</template>

<script setup lang="ts">
import type { Post } from '@csisp/contracts';

defineProps<{
  post: Post;
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.post-meta {
  color: #8c8c8c;
  font-size: 14px;
  margin-bottom: 24px;
  display: flex;
  gap: 24px;
}

.post-body {
  line-height: 1.8;
  font-size: 16px;
}
</style>
