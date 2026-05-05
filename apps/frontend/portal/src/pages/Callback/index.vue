<template>
  <div class="callback-page">
    <n-spin :show="loading" description="正在处理登录授权..." />
    <div v-if="!loading && error" class="error">
      <n-alert :title="'登录失败'" type="error">
        {{ error }}
      </n-alert>
      <n-button style="margin-top: 16px" @click="goToLogin">
        返回登录
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  handleOAuthCallback,
  consumeRedirectAfterLogin,
  initOAuthClient,
} from '@csisp/oauth';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);

async function processCallback() {
  try {
    initOAuthClient();
    const result = await handleOAuthCallback();
    if (result.ok) {
      const redirectPath = await consumeRedirectAfterLogin();
      await router.replace(redirectPath || '/');
    } else {
      error.value = result.error || '处理登录授权失败';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '处理登录授权时发生错误';
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push('/');
}

onMounted(() => {
  processCallback();
});
</script>

<style scoped>
.callback-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.error {
  max-width: 400px;
  text-align: center;
}
</style>
