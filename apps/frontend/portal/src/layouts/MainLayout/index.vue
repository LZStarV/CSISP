<template>
  <n-layout style="height: 100vh">
    <n-layout>
      <n-layout-header style="height: 64px; overflow: hidden" bordered>
        <Header />
      </n-layout-header>
    </n-layout>
    <n-layout position="absolute" style="top: 64px" has-sider>
      <n-layout-sider
        bordered
        :collapsed="mainLayoutStore.siderCollapsed"
        :width="200"
        :collapsed-width="64"
        show-trigger="arrow-circle"
        collapse-mode="width"
        @update:collapsed="mainLayoutStore.setSiderCollapsed"
      >
        <Sider />
      </n-layout-sider>
      <n-layout-content class="main-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import Header from './Header.vue';
import Sider from './Sider.vue';
import { useMainLayoutStore } from './store';

const mainLayoutStore = useMainLayoutStore();
</script>

<style lang="scss" scoped>
.main-content {
  overflow: hidden;
  padding: 24px;
  background: #f5f7f9;
}
</style>
