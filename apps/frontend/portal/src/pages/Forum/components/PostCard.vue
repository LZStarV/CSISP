<template>
  <n-card class="post-card" hoverable @click="$emit('click')">
    <template #header>
      <div style="font-weight: 500">{{ post.title }}</div>
      <div class="post-meta">
        <span>作者：{{ post.authorName }}</span>
        <span>发布时间：{{ formatDate(post.createdAt) }}</span>
      </div>
    </template>
    <div class="post-excerpt">{{ post.content.substring(0, 150) }}...</div>
  </n-card>
</template>

<script setup lang="ts">
import type { Post } from '@csisp/contracts';

defineProps<{
  post: Post;
}>();

defineEmits<{
  click: [];
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style lang="scss" scoped>
.post-card {
  cursor: pointer;
  width: 100%;
}

.post-meta {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 8px;
  display: flex;
  gap: 24px;
}

.post-excerpt {
  color: #262626;
  line-height: 1.6;
}
</style>
