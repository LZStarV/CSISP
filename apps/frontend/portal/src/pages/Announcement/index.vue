<template>
  <div class="announcement-page">
    <a-page-header :title="t('announcement.title', '公告列表')" />
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
          showTotal: (total: number) =>
            t('common.total', { total }, `共 ${total} 条`),
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
  </div>
</template>

<script setup lang="ts">
import type { Announcement } from '@csisp/contracts';
import { message } from 'ant-design-vue';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import AnnouncementCard from './components/AnnouncementCard.vue';

import { announceApi } from '@/api/portal/announce';

const { t } = useI18n();

const loading = ref(false);
const announcements = ref<Announcement[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

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
    message.error(t('announcement.fetchFailed', '获取公告列表失败'));
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (current: number, size: number) => {
  page.value = current;
  pageSize.value = size;
  fetchAnnouncements();
};

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style lang="scss" scoped>
.announcement-page {
  background: white;
  padding: 24px;
  border-radius: 4px;
}

.announcement-list {
  margin-top: 16px;
}
</style>
