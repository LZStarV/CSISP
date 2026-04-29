<template>
  <div class="announcement-page">
    <n-page-header :title="t('announcement.title', '公告列表')" />
    <n-spin :show="loading">
      <n-list class="announcement-list" hoverable clickable>
        <template #default>
          <n-list-item v-for="item in announcements" :key="item.id">
            <AnnouncementCard :announcement="item" />
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
import type { Announcement } from '@csisp/contracts';
import { useMessage } from 'naive-ui';
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import AnnouncementCard from './components/AnnouncementCard.vue';

import { announceApi } from '@/api/portal/announce';

const message = useMessage();
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

watch(page, () => {
  fetchAnnouncements();
});

watch(pageSize, () => {
  page.value = 1;
  fetchAnnouncements();
});

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
