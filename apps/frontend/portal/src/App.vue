<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useAppStore } from '@/stores';

const appStore = useAppStore();

onMounted(() => {
  appStore.initFromStorage();
});
</script>
