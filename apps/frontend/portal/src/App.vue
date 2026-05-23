<template>
  <n-config-provider
    :locale="localeStore.naiveLocale"
    :date-locale="localeStore.naiveDateLocale"
    :theme="themeStore.naiveTheme"
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
import { useThemeStore } from '@/stores/theme';
import { useUserStore } from '@/stores/user';

const localeStore = useLocaleStore();
const mainLayoutStore = useMainLayoutStore();
const userStore = useUserStore();
const themeStore = useThemeStore();

onMounted(async () => {
  await Promise.all([
    mainLayoutStore.initFromStorage(),
    localeStore.initFromStorage(),
    userStore.fetchCurrentUser(),
    themeStore.initFromStorage(),
  ]);
});
</script>
