<template>
  <div class="forum-detail-page">
    <a-page-header :title="post?.title" @back="navigateBack">
      <template #breadcrumb>
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/Forum">{{
              t('forum.title', '帖子广场')
            }}</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{
            t('forum.detail.title', '帖子详情')
          }}</a-breadcrumb-item>
        </a-breadcrumb>
      </template>
    </a-page-header>
    <a-spin :spinning="loading">
      <div v-if="post" class="post-detail">
        <PostContent :post="post" />
        <div class="reply-section">
          <a-divider orientation="left">{{
            t('forum.detail.replyList', '回复列表')
          }}</a-divider>
          <ReplyList :replies="replies" />
          <a-card
            class="reply-input-section"
            :title="t('forum.detail.postReply', '发表回复')"
          >
            <a-form :model="replyForm" layout="vertical">
              <a-form-item
                :label="t('forum.detail.replyContent', '回复内容')"
                name="content"
                :rules="[
                  {
                    required: true,
                    message: t('forum.detail.fillContent', '请填写回复内容'),
                  },
                ]"
              >
                <a-textarea
                  v-model:value="replyForm.content"
                  :placeholder="
                    t('forum.detail.replyContentPlaceholder', '请输入回复内容')
                  "
                  :rows="4"
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleCreateReply">{{
                  t('forum.detail.postReply', '发表回复')
                }}</a-button>
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
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ReplyList from './components/ReplyList.vue';

import { forumApi } from '@/api/portal/forum';
import PostContent from '@/components/Forum/PostContent.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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
    message.error(t('forum.detail.fetchFailed', '获取帖子详情失败'));
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
    message.error(t('forum.detail.fillContent', '请填写回复内容'));
    return;
  }
  try {
    await forumApi.createReply({
      postId,
      content: replyForm.value.content,
    });
    message.success(t('forum.detail.success', '回复成功'));
    replyForm.value.content = '';
    fetchPostDetail();
  } catch {
    message.error(t('forum.detail.failed', '回复失败'));
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
