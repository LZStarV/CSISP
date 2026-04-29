<template>
  <a-menu
    v-model:selectedKeys="selectedKeys"
    theme="dark"
    mode="inline"
    :items="menuItems"
    @click="handleMenuClick"
  />
</template>

<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const selectedKeys = ref<string[]>([]);

const menuItems = computed<MenuProps['items']>(() => [
  { key: '/Announcement', label: t('layout.sider.announcement', '公告') },
  { key: '/Forum', label: t('layout.sider.forum', '论坛') },
]);

watch(
  () => route.path,
  newPath => {
    selectedKeys.value = [newPath];
  },
  { immediate: true }
);

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key);
};
</script>
