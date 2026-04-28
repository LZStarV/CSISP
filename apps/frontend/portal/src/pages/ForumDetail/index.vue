<template>
  <div class="forum-detail-page">
    <a-page-header :title="post?.title" @back="navigateBack">
      <template #breadcrumb>
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/Forum">帖子广场</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>帖子详情</a-breadcrumb-item>
        </a-breadcrumb>
      </template>
    </a-page-header>
    <a-spin :spinning="loading">
      <div v-if="post" class="post-detail">
        <PostContent :post="post" />
        <div class="reply-section">
          <a-divider orientation="left">回复列表</a-divider>
          <ReplyList :replies="replies" />
          <a-card class="reply-input-section" title="发表回复">
            <a-form :model="replyForm" layout="vertical">
              <a-form-item
                label="回复内容"
                name="content"
                :rules="[{ required: true, message: '请输入回复内容' }]"
              >
                <a-textarea
                  v-model:value="replyForm.content"
                  placeholder="请输入回复内容"
                  :rows="4"
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleCreateReply"
                  >发表回复</a-button
                >
              </a-form-item>
            </a-form>
          </a-card>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import type { Post, Reply } from '@csisp/contracts';
import { message } from 'ant-design-vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ReplyList from './components/ReplyList.vue';

import { forumApi } from '@/api/portal/forum';
import PostContent from '@/components/Forum/PostContent.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const post = ref<Post | null>(null);
const replies = ref<Reply[]>([]);

const replyForm = ref({
  content: '',
});

const fetchPostDetail = async () => {
  const postId = route.params.postId as string;
  loading.value = true;
  try {
    const response = await forumApi.getPostDetail({ postId });
    post.value = response.post || null;
    replies.value = response.replies || [];
  } catch {
    message.error('获取帖子详情失败');
  } finally {
    loading.value = false;
  }
};

const navigateBack = () => {
  router.push('/Forum');
};

const handleCreateReply = async () => {
  const postId = route.params.postId as string;
  if (!replyForm.value.content) {
    message.error('请填写回复内容');
    return;
  }
  try {
    await forumApi.createReply({
      postId,
      content: replyForm.value.content,
    });
    message.success('回复成功');
    replyForm.value.content = '';
    fetchPostDetail();
  } catch {
    message.error('回复失败');
  }
};

onMounted(() => {
  fetchPostDetail();
});
</script>

<style scoped>
.forum-detail-page {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.post-detail {
  padding: 0 24px;
}

.reply-section {
  margin-top: 32px;
}

.reply-input-section {
  margin-top: 24px;
}
</style>
