<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">页面未找到</div>
      <div class="error-description">抱歉，您访问的页面不存在或已被移除</div>
      <n-button type="primary" @click="goHome"> 返回首页 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .not-found-content {
    text-align: center;
    color: #fff;

    .error-code {
      font-size: 120px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 16px;
      text-shadow: 0 4px 20px rgb(0 0 0 / 30%);
    }

    .error-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .error-description {
      font-size: 16px;
      margin-bottom: 32px;
      opacity: 0.8;
    }
  }
}
</style>
