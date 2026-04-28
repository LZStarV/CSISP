<template>
  <div class="announcement-page">
    <a-page-header title="公告列表">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">发布公告</a-button>
      </template>
    </a-page-header>
    <a-spin :spinning="loading">
      <a-list
        class="announcement-list"
        :data-source="announcements"
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
            <AnnouncementCard :announcement="item" />
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <a-modal
      v-model:open="createModalVisible"
      title="发布公告"
      @ok="handleCreateAnnouncement"
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
            placeholder="请输入公告标题"
          />
        </a-form-item>
        <a-form-item
          label="内容"
          name="content"
          :rules="[{ required: true, message: '请输入内容' }]"
        >
          <a-textarea
            v-model:value="createForm.content"
            placeholder="请输入公告内容"
            :rows="6"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { Announcement } from '@csisp/contracts';
import { message } from 'ant-design-vue';
import { ref, onMounted } from 'vue';

import AnnouncementCard from './components/AnnouncementCard.vue';

import { announceApi } from '@/api/portal/announce';

const loading = ref(false);
const announcements = ref<Announcement[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const createModalVisible = ref(false);
const createForm = ref({
  title: '',
  content: '',
});

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const response = await announceApi.getAnnouncementList({
      page: page.value,
      pageSize: pageSize.value,
    });
    announcements.value = response.announcements;
    total.value = response.total;
  } catch {
    message.error('获取公告列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (current: number, size: number) => {
  page.value = current;
  pageSize.value = size;
  fetchAnnouncements();
};

const openCreateModal = () => {
  createForm.value = { title: '', content: '' };
  createModalVisible.value = true;
};

const handleCreateCancel = () => {
  createModalVisible.value = false;
};

const handleCreateAnnouncement = async () => {
  if (!createForm.value.title || !createForm.value.content) {
    message.error('请填写标题和内容');
    return;
  }
  try {
    await announceApi.createAnnouncement(createForm.value);
    message.success('发布公告成功');
    createModalVisible.value = false;
    fetchAnnouncements();
  } catch {
    message.error('发布公告失败');
  }
};

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
.announcement-page {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.announcement-list {
  margin-top: 16px;
}
</style>
