<template>
  <div class="forum-page">
    <n-page-header :title="t('forum.title', '帖子广场')" />
    <n-spin :show="loading">
      <n-list class="post-list" hoverable clickable>
        <template #default>
          <n-list-item v-for="item in posts" :key="item.id">
            <PostCard :post="item" @click="navigateToDetail(item.id)" />
          </n-list-item>
        </template>
        <template #footer>
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :item-count="total"
            :page-sizes="[10, 20, 50]"
            show-size-picker
            show-quick-jumper
          >
            <template #prefix="{ itemCount }">
              {{
                t('common.total', { total: itemCount }, `共 ${itemCount} 条`)
              }}
            </template>
          </n-pagination>
        </template>
      </n-list>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@csisp/contracts';
import { useMessage } from 'naive-ui';
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import PostCard from './components/PostCard.vue';

import { forumApi } from '@/api/portal/forum';

const router = useRouter();
const message = useMessage();
const { t } = useI18n();

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
    message.error(t('forum.fetchFailed', '获取帖子列表失败'));
  } finally {
    loading.value = false;
  }
};

watch(page, () => {
  fetchPosts();
});

watch(pageSize, () => {
  page.value = 1;
  fetchPosts();
});

const navigateToDetail = (postId: string) => {
  router.push(`/Forum/${postId}`);
};

onMounted(() => {
  fetchPosts();
});
</script>

<style lang="scss" scoped>
.forum-page {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.post-list {
  margin-top: 16px;
}
</style>
