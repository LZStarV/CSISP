<template>
  <div class="forum-detail-page">
    <n-page-header :title="post?.title" @back="navigateBack">
      <template #extra>
        <n-breadcrumb>
          <n-breadcrumb-item>
            <router-link to="/Forum">{{
              t('forum.title', '帖子广场')
            }}</router-link>
          </n-breadcrumb-item>
          <n-breadcrumb-item>{{
            t('forum.detail.title', '帖子详情')
          }}</n-breadcrumb-item>
        </n-breadcrumb>
      </template>
    </n-page-header>

    <n-spin :show="loading">
      <div v-if="post" class="post-detail">
        <PostContent :post="post" />

        <div class="reply-section">
          <n-divider title-placement="left">{{
            t('forum.detail.replyList', '回复列表')
          }}</n-divider>
          <ReplyList :replies="replies" />

          <n-card
            class="reply-input-section"
            :title="t('forum.detail.postReply', '发表回复')"
          >
            <n-form
              ref="formRef"
              :model="replyForm"
              :rules="formRules"
              label-placement="top"
            >
              <n-form-item
                :label="t('forum.detail.replyContent', '回复内容')"
                path="content"
              >
                <n-input
                  v-model:value="replyForm.content"
                  type="textarea"
                  :placeholder="
                    t('forum.detail.replyContentPlaceholder', '请输入回复内容')
                  "
                  :rows="4"
                />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" @click="handleCreateReply">{{
                  t('forum.detail.postReply', '发表回复')
                }}</n-button>
              </n-form-item>
            </n-form>
          </n-card>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import type { Post, Reply } from '@csisp/contracts';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ReplyList from './components/ReplyList.vue';

import { forumApi } from '@/api/portal/forum';
import PostContent from '@/components/Forum/PostContent.vue';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const { t } = useI18n();

const formRef = ref<FormInst | null>(null);

const loading = ref(false);
const post = ref<Post | null>(null);
const replies = ref<Reply[]>([]);

const replyForm = ref({
  content: '',
});

const formRules: FormRules = {
  content: [
    {
      required: true,
      message: t('forum.detail.fillContent', '请填写回复内容'),
      trigger: ['input', 'blur'],
    },
  ],
};

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

  try {
    await formRef.value?.validate();
  } catch {
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

<style lang="scss" scoped>
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
