<template>
  <a-layout class="main-layout">
    <a-layout-header class="header">
      <div class="logo">{{ t('layout.header.title', '论坛系统') }}</div>
      <div class="user-info">
        <span>{{ t('layout.header.user', '测试用户') }}</span>
        <LanguageSwitcher />
      </div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" theme="dark">
        <Sider />
      </a-layout-sider>
      <a-layout-content class="main-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import Sider from './Sider.vue';

import LanguageSwitcher from '@/components/LanguageSwitcher/index.vue';

const { t } = useI18n();
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  background: #001529;
  color: white;
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

.main-content {
  background: #f0f2f5;
  padding: 24px;
}
</style>
