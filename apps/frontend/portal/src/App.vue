<template>
  <n-config-provider
    :locale="localeStore.naiveLocale"
    :date-locale="localeStore.naiveDateLocale"
  >
    <n-notification-provider>
      <n-message-provider>
        <n-dialog-provider>
          <RouterView />
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useMainLayoutStore } from '@/layouts/MainLayout/store';
import { useLocaleStore } from '@/stores/locale';

const localeStore = useLocaleStore();
const mainLayoutStore = useMainLayoutStore();

onMounted(async () => {
  await Promise.all([
    mainLayoutStore.initFromStorage(),
    localeStore.initFromStorage(),
  ]);
});
</script>
