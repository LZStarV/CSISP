<template>
  <div class="forum-page">
    <a-page-header title="帖子广场" />
    <a-spin :spinning="loading">
      <a-list
        class="post-list"
        :data-source="posts"
        :pagination="{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
          onChange: handlePageChange,
        }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <PostCard :post="item" @click="navigateToDetail(item.id)" />
          </a-list-item>
        </template>
      </a-list>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@csisp/contracts';
import { message } from 'ant-design-vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import PostCard from './components/PostCard.vue';

import { forumApi } from '@/api/portal/forum';

const router = useRouter();
const loading = ref(false);
const posts = ref<Post[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const fetchPosts = async () => {
  loading.value = true;
  try {
    const response = await forumApi.getPostFeed({
      page: page.value,
      pageSize: pageSize.value,
    });
    posts.value = response.posts;
    total.value = response.total;
  } catch {
    message.error('获取帖子列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (current: number, size: number) => {
  page.value = current;
  pageSize.value = size;
  fetchPosts();
};

const navigateToDetail = (postId: string) => {
  router.push(`/Forum/${postId}`);
};

onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
.forum-page {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.post-list {
  margin-top: 16px;
}
</style>
