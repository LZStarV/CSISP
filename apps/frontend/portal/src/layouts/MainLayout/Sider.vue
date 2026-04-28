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
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const selectedKeys = ref<string[]>([]);

const menuItems: MenuProps['items'] = [
  { key: '/Announcement', label: '公告' },
  { key: '/Forum', label: '论坛' },
];

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
