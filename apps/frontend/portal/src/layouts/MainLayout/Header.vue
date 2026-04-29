<template>
  <div class="header-content">
    <div class="logo">{{ t('layout.header.title', '论坛系统') }}</div>
    <div class="user-info">
      <span>{{ t('layout.header.user', '测试用户') }}</span>
      <LanguageSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import LanguageSwitcher from '@/components/LanguageSwitcher/index.vue';

const { t } = useI18n();
</script>

<style scoped>
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
