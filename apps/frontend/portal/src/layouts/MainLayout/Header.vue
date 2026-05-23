<template>
  <div class="header-content">
    <div class="logo">{{ t('layout.header.title', '论坛系统') }}</div>
    <div class="user-info">
      <span>{{ userStore.userProfile?.display_name }}</span>
      <LanguageSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import LanguageSwitcher from '@/components/LanguageSwitcher/index.vue';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const userStore = useUserStore();
</script>

<style lang="scss" scoped>
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
}

.user-info {
  font-size: 14px;
}
</style>
