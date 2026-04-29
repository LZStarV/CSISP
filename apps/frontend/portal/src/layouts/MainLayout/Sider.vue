<template>
  <n-menu
    :value="activeKey"
    :options="menuOptions"
    :collapsed="mainLayoutStore.siderCollapsed"
    :collapsed-width="64"
    :icon-size="18"
    :dropdown-props="{ placement: 'right' }"
    @update:value="handleMenuUpdate"
  />
</template>

<script setup lang="ts">
import {
  ChatbubbleEllipsesOutline,
  NotificationsOutline,
} from '@vicons/ionicons5';
import type { MenuOption } from 'naive-ui';
import { h } from 'vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useMainLayoutStore } from './store';

const mainLayoutStore = useMainLayoutStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const activeKey = ref<string>('');

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: t('layout.sider.announcement', '公告'),
    key: '/Announcement',
    icon: () => h(NotificationsOutline),
  },
  {
    label: t('layout.sider.forum', '论坛'),
    key: '/Forum',
    icon: () => h(ChatbubbleEllipsesOutline),
  },
]);

watch(
  () => route.path,
  newPath => {
    activeKey.value = newPath;
  },
  { immediate: true }
);

const handleMenuUpdate = (key: string) => {
  router.push(key);
};
</script>
