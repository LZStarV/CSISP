<template>
  <div class="forum-page">
    <a-page-header title="帖子广场">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">发帖</a-button>
      </template>
    </a-page-header>
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
          showTotal: total => `共 ${total} 条`,
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

    <a-modal
      v-model:open="createModalVisible"
      title="发帖"
      @ok="handleCreatePost"
      @cancel="handleCreateCancel"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item
          label="标题"
          name="title"
          :rules="[{ required: true, message: '请输入标题' }]"
        >
          <a-input
            v-model:value="createForm.title"
            placeholder="请输入帖子标题"
          />
        </a-form-item>
        <a-form-item
          label="内容"
          name="content"
          :rules="[{ required: true, message: '请输入内容' }]"
        >
          <a-textarea
            v-model:value="createForm.content"
            placeholder="请输入帖子内容"
            :rows="6"
          />
        </a-form-item>
      </a-form>
    </a-modal>
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

const createModalVisible = ref(false);
const createForm = ref({
  title: '',
  content: '',
});

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

const openCreateModal = () => {
  createForm.value = { title: '', content: '' };
  createModalVisible.value = true;
};

const handleCreateCancel = () => {
  createModalVisible.value = false;
};

const handleCreatePost = async () => {
  if (!createForm.value.title || !createForm.value.content) {
    message.error('请填写标题和内容');
    return;
  }
  try {
    await forumApi.createPost(createForm.value);
    message.success('发帖成功');
    createModalVisible.value = false;
    fetchPosts();
  } catch {
    message.error('发帖失败');
  }
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
