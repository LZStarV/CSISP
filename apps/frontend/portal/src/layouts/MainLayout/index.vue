<template>
  <a-layout class="main-layout">
    <a-layout-header class="header">
      <div class="logo">论坛系统</div>
      <div class="user-info">
        <span>测试用户</span>
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
import Sider from './Sider.vue';
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
