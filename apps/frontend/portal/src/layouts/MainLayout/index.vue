<template>
  <a-layout class="main-layout">
    <a-layout-header style="background: #fff; color: #333">
      <Header />
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" theme="light">
        <Sider />
      </a-layout-sider>
      <a-layout-content class="main-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import Header from './Header.vue';
import Sider from './Sider.vue';
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-content {
  background: #f0f2f5;
  padding: 24px;
}
</style>
